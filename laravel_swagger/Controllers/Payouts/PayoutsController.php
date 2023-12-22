<?php

namespace App\Api\V1\Controllers\Billing\Payouts;

use App\Api\V1\Controllers\BaseController;
use App\Api\V1\Requests\Payouts\CreateGoalPayoutRequest;
use App\Api\V1\Requests\Payouts\CreateTransactionsPayoutRequest;
use App\Api\V1\Transformers\PaymentTransformer;
use App\BankAccount;
use App\Gateways\Pin\Gateway;
use App\Goal;
use App\Jobs\Billing\WithdrawGoalPayout;
use App\Jobs\Billing\WithdrawTransactionPayout;
use App\Transaction;
use App\User;
use Dingo\Api\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @Resource("Billing", uri="/api/v1/billing")
 */
class PayoutsController extends BaseController
{
    /**
     * Get list of paid transactions for payout
     *
     * @Get("/payouts/{$goal_id}/transactions")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request(headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json", "Content-Type": "application/json"}),
     *    @Response(
     *              200,
     *              body={
     *                  "message": "Success - Transactions found.",
     *                  "data": {
     *                      {
     *                          "id": 1,
     *                          "token": "ch_g2G-3ztzoj455YSOXWi-Rw",
     *                          "status": "paid",
     *                          "amount": 15,
     *                          "goal_id": 1,
     *                          "goal_name": "Goal name",
     *                          "card_number": "XXXX-XXXX-XXXX-0000",
     *                          "scheduled_to": null,
     *                      },
     *                      {
     *                          "id": 2,
     *                          "token": "ch_g2G-3ztzoj4kfoOXWi-Rw",
     *                          "status": "paid",
     *                          "amount": 25,
     *                          "goal_id": 1,
     *                          "goal_name": "Goal name",
     *                          "card_number": "XXXX-XXXX-XXXX-0000",
     *                          "scheduled_to": null,
     *                      }
     *                  },
     *              }
     *    ),
     *    @Response(404, body={"error": {"message": "Goal with this ID does not exist.", "status_code": 404}}),
     *    @Response(403, body={"error": {"message": "You must be a goal owner!", "status_code": 403}}),
     *    @Response(404, body={"error": {"message": "The are no paid transactions found for this goal.", "status_code": 404}})
     * })
     * @param Request $request
     * @param $goal_id
     * @return \Dingo\Api\Http\Response
     */
    public function show(Request $request, $goal_id)
    {
        $user = $request->user();

        if (! $goal = Goal::find($goal_id)) {
            throw new NotFoundHttpException('Goal with this ID does not exist.');
        }

        if (! $user->isGoalOwner($goal)) {
            throw new AccessDeniedHttpException('You must be a goal owner!');
        }

        $payments = $goal->transactions()
            ->with('user')
            ->with(['card' => function($query) {
                $query->withTrashed();
            }])->paid()->get();

        if ($payments->count() > 0) {
            return $this->response()->collection(
                $payments,
                new PaymentTransformer()
            )->setMeta(['message' => 'Success - Transactions found.']);
        } else {
            throw new NotFoundHttpException('The are no paid transactions found for this goal.');
        }
    }

    /**
     * Create new payout request for goal owner
     *
     * @Post("/payouts/{goal_id}/create")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request(headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json", "Content-Type": "application/json"}),
     *    @Response(200, body={"message": "Success - Your request has been set to queue and will be processed soon."}),
     *    @Response(422, body={"error": {"message": "422 Unprocessable Entity", "status_code": 422}}),
     *    @Response(404, body={"error": {"message": "Bank account details not found.", "status_code": 404}}),
     *    @Response(403, body={"error": {"message": "You must be goal owner!", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "You can request goal payout only for archived goal.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Goal is already paid out.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "One or more transactions is pending to refund.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "No paid transactions in this goal.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Payout Request available only after 2 days after the last transaction.", "status_code": 403}})
     * })
     * @param Request $request
     * @param $goal_id
     * @param Gateway $gateway
     * @return \Dingo\Api\Http\Response
     */
    public function storeGoalPayout(Request $request, $goal_id, Gateway $gateway)
    {
        $user = $request->user();

        if (! $bankAccount = $user->bankAccount) {
            throw new NotFoundHttpException('Bank account details not found.');
        }

        if (! $goal = $user->myGoals()->find($goal_id)) {
            throw new AccessDeniedHttpException("You must be goal owner!");
        }
        $this->authorize('withdraw', $goal);

        $recipientToken = $this->makeRecipient($user, $bankAccount, $gateway)->token;

        WithdrawGoalPayout::dispatch($goal, $recipientToken, $bankAccount)->onQueue('billing');

        return response()->json([
            'message' => 'Success - Your request has been set to queue and will be processed soon.'
        ], 200);
    }

    /**
     * Create new transactions payout request for goal owner
     *
     * @Post("/payouts/{goal_id}/transactions/create")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request({
     *              "transactions": {
     *                  "0": 1,
     *                  "1": 10,
     *                  "2": 23,
     *              },
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json", "Content-Type": "application/json"}),
     *    @Response(200, body={"message": "Success - Your request has been set to queue and will be processed soon."}),
     *    @Response(422, body={"error": {"message": "422 Unprocessable Entity", "status_code": 422}}),
     *    @Response(404, body={"error": {"message": "Bank account details not found.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "Transactions with id: 77 not found.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "Goal with this ID does not exist.", "status_code": 404}}),
     *    @Response(403, body={"error": {"message": "You must be goal owner!", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Goal is already paid out.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "One or more transactions is pending to refund.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "One or more transactions have been already processed.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Payout Request available only for already paid transactions.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Payout Request available only after 2 days after transaction has been paid.", "status_code": 403}})
     * })
     * @param CreateTransactionsPayoutRequest|Request $request
     * @param $goal_id
     * @param Gateway $gateway
     * @return \Dingo\Api\Http\Response
     */
    public function storeTransactionsPayout(CreateTransactionsPayoutRequest $request, $goal_id, Gateway $gateway)
    {
        $user = $request->user();

        if (! $goal = Goal::find($goal_id)) {
            throw new NotFoundHttpException('Goal with this ID does not exist.');
        }
        if (! $bankAccount = $user->bankAccount) {
            throw new NotFoundHttpException('Bank account details not found.');
        }

        $transactions = $goal->transactions()->whereIn('id', $request->transactions)->get();

        if (count($request->transactions) != $transactions->count()) {
            $missed = implode(', ', array_diff($request->transactions, $transactions->pluck('id')->toArray()));
            throw new NotFoundHttpException("Transactions with id: {$missed} not found.");
        }

        foreach ($transactions as $transaction) {
            $this->authorize('withdraw', [$transaction, $goal]);
        }

        $recipientToken = $this->makeRecipient($user, $bankAccount, $gateway)->token;

        $transactions->each(function ($transaction) use ($recipientToken, $bankAccount, $goal) {
            WithdrawTransactionPayout::dispatch($goal, $transaction, $recipientToken, $bankAccount)->onQueue('billing');
        });

        return response()->json([
            'message' => 'Success - Your request has been set to queue and will be processed soon.'
        ], 200);
    }

    private function makeRecipient(User $user, BankAccount $bankAccount, Gateway $gateway)
    {
        $recipientResponse = $gateway->createRecipient([
            'email' => $user->email,
            'name' => $user->name,
            'bank_account' => [
                'name' => $bankAccount->name,
                'bsb' => $bankAccount->bsb,
                'number' => $bankAccount->number
            ]
        ])->send();
        if(! $recipientResponse->isSuccessful()) {
            return $this->responseWithErrors($recipientResponse);
        }

        return $this->getResponseData($recipientResponse);
    }
}