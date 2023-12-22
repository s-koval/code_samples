<?php

namespace App\Traits\Users;

use App\BankAccount;
use App\Billing\ContributionCalculator;
use App\Goal;
use App\Notifications\Goals\GoalHasBeenArchived;
use App\Events\MemberCompletedGoal;
use App\Refund;
use App\Transaction;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

trait HasContributions
{
    protected $frequency = [
        'daily' => '1 day',
        'weekly' => '1 week',
        'fortnightly' => '2 week',
        'monthly' => '1 month',
    ];

    public function generatePendingTransactions(Goal $goal, $data)
    {
        $startDate = Carbon::parse($data['first_payment_date']);
        $period = CarbonPeriod::create($startDate, $this->frequency[$data['frequency']], $goal->deadline);
        foreach ($period as $date) {
            $this->makePendingTransaction($goal, $data, $date);
        }
    }

    public function regeneratePendingTransactions(Goal $goal, $data)
    {
        $this->transactions()->withFilters($goal->id, Transaction::PENDING_STATUS)->delete();
        $this->generatePendingTransactions($goal, $data);
    }

    public function makePendingTransaction(Goal $goal, $data, $scheduled_to = null)
    {
        $calculator = (new ContributionCalculator($this, $goal, $data['amount']))->calc();
        return $this->transactions()->create([
            'goal_id' => $goal->id,
            'card_id' => $data['card_id'],
            'amount' => $data['amount'],
            'charge_amount' => $calculator->getTotal(),
            'paydby_fee' => $calculator->getContributionFee(),
            'description' => $data['description'],
            'status' => Transaction::PENDING_STATUS,
            'ip_address' => $data['ip_address'],
            'scheduled_to' => $scheduled_to
        ]);
    }

    public function processSuccessContribution(Goal $goal, Transaction $transaction, $response)
    {
        DB::transaction(function () use ($goal, $transaction, $response) {
            $transaction->update([
                'token' => $response->token,
                'status' => Transaction::PAID_STATUS,
                'paid_at' => Carbon::parse($response->captured_at)->toDateTimeString(),
                'cancelled_at' => null
            ]);
            $this->makeContribution($goal, $transaction);
            if ($contribution = $this->getMemberContribution($goal->id)) {
                $this->goals()->updateExistingPivot($goal->id, [
                    'paid_contribution' => $contribution->pivot->paid_contribution + $transaction->amount
                ]);
            }
            if ($goal->fresh()->isCompleted()) {
                $goal->is_completed = true;
                $goal->save();
                $goal->owner->notify((new GoalHasBeenArchived($goal))->onQueue('emails'));
            }
        }, 5);
    }

    public function getMemberContribution($goal_id)
    {
        return $this->goals()->whereGoalId($goal_id)->first();
    }

    public function makeContribution($goal, $transaction)
    {
        $memberCompletedGoal = $this->isGoalCompleted($goal->id, $transaction->amount);
        $this->contributions()->create([
            'goal_id' => $goal->id,
            'transaction_id' => $transaction->id,
            'amount' => $transaction->amount,
            'goal_is_completed' => $memberCompletedGoal
        ]);
        $goal = $goal->fresh();
        if ($memberCompletedGoal) {
            event(new MemberCompletedGoal($goal, $this));
            $this->transactions()->withFilters($goal->id, Transaction::PENDING_STATUS)->delete();
        }
    }

    public function isGoalCompleted($goal_id, $amount)
    {
        if (! $goal = $this->goals()->whereGoalId($goal_id)->first()) {
            return false;
        }
        if ($goal->pivot->contribution == 0) {
            return false;
        }
        return $goal->pivot->contribution - $goal->pivot->paid_contribution - $amount <= 0;
    }

    public function processSuccessPayout(Goal $goal, BankAccount $bankAccount, $transfer, Transaction $transaction = null)
    {
        DB::transaction(function () use ($goal, $bankAccount, $transfer, $transaction) {
            $this->withdrawals()->create([
                'goal_id' => $goal->id,
                'transaction_id' => $transaction ? $transaction->id : null,
                'token' => $transfer->token,
                'status' => $transfer->status,
                'currency' => $transfer->currency,
                'amount' => $transfer->amount / 100,
                'bank_account_id' => $bankAccount->id,
                'paid_at' => Carbon::parse($transfer->paid_at)->toDateString(),
            ]);
            if ($transaction) {
                $transaction->update(['status' => Transaction::PAID_OUT_STATUS]);
            } else {
                $goal->is_paid_out = true;
                $goal->save();
            }
        }, 5);
    }

    public function processRefundRequest(Transaction $transaction, $refund, $fee)
    {
        DB::transaction(function () use ($transaction, $refund, $fee) {
            $this->refunds()->create([
                'goal_id' => $transaction->goal->id,
                'transaction_id' => $transaction->id,
                'token' => $refund->token,
                'success' => $refund->success,
                'amount' => $refund->amount / 100,
                'paydby_fee' => $fee,
                'currency' => $refund->currency,
                'error_message' => $refund->error_message,
                'status_message' => $refund->status_message,
            ]);

            $contribution = $this->getMemberContribution($transaction->goal->id);
            $this->goals()->updateExistingPivot($transaction->goal->id, [
                'paid_contribution' => $contribution->pivot->paid_contribution - $refund->amount
            ]);

            $transaction->update([
                'status' => Transaction::PENDING_REFUND_STATUS
            ]);

        }, 5);
    }

    public function processSuccessRefund(Refund $refund)
    {
        DB::transaction(function () use ($refund) {
            $refund->refunded_at = Carbon::now()->toDateString();
            $refund->save();

            $refund->transaction->update([
                'status' => Transaction::REFUND_STATUS,
                'paid_at' => null,
            ]);
        }, 5);

    }

    public function processFailedRefund($refund) {
        DB::transaction(function () use ($refund) {
            $contribution = $this->getMemberContribution($refund->goal_id);
            $this->goals()->updateExistingPivot($refund->goal_id, [
                'paid_contribution' => $contribution->pivot->paid_contribution + $refund->amount
            ]);
            $refund->transaction->update([
                'status' => Transaction::PAID_STATUS
            ]);
        }, 5);
    }
}