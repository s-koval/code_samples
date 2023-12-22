<?php

namespace App\Api\V1\Controllers\Billing\Refunds;

use App\Api\V1\Controllers\BaseController;
use App\Api\V1\Requests\Refunds\CreateTransactionsRefundRequest;
use App\Billing\RefundsCalculator;
use App\Gateways\Pin\Gateway;
use App\Jobs\Billing\RefundTransaction;
use App\Transaction;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @Resource("Billing", uri="/api/v1/billing")
 */
class RefundsController extends BaseController
{
    /**
     * Get preliminary information on refund.
     *
     * @Post("refunds/transactions/calculate")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request({
     *              "transactions": {
     *                  "0": 1,
     *                  "1": 10,
     *                  "2": 23,
     *              },
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *    @Response(
     *              200,
     *              body={
     *                  "message": "Success.",
     *                  "data": {
     *                      "refund_amount": 106,
     *                      "fee": 25,
     *                      "total": 81,
     *                  }
     *              }
     *    ),
     *    @Response(422, body={"error": {"message": "422 Unprocessable Entity", "status_code": 422}}),
     *    @Response(404, body={"error": {"message": "Transactions with id: 77 not found.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "Goal related to transaction not found.", "status_code": 404}}),
     *    @Response(403, body={"error": {"message": "Refund is not possible for goal owner!", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Goal is already paid out.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "One or more transactions have been already processed.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request available only for already paid transactions.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request available only after 2 days after transaction has been paid.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request is not available because fee is grater than refund amount.", "status_code": 403}})
     * })
     * @param CreateTransactionsRefundRequest $request
     * @return \Dingo\Api\Http\Response
     */
    public function calculate(CreateTransactionsRefundRequest $request)
    {
        $transactions = $this->authorizeTransactions($request);

        $refund = (new RefundsCalculator($transactions))->prepare();

        if (! $refund['allowed']) {
            throw new AccessDeniedHttpException("Refund Request is not available because fee is grater than refund amount.");
        }

        return response()->json([
            'message' => 'Success.',
            'data' => [
                'refund_amount' => $refund['info']['refund_amount'],
                'fee' => $refund['info']['fee'],
                'total' => $refund['info']['total'],
            ]
        ], 200);
    }

    /**
     * Create new refund request for transactions
     *
     * @Post("/refunds/transactions/create")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request({
     *              "transactions": {
     *                  "0": 1,
     *                  "1": 10,
     *                  "2": 23,
     *              },
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *    @Response(200, body={"message": "Success - Your request has been set to queue and will be processed soon."}),
     *    @Response(422, body={"error": {"message": "422 Unprocessable Entity", "status_code": 422}}),
     *    @Response(404, body={"error": {"message": "Transactions with id: 77 not found.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "Goal related to transaction not found.", "status_code": 404}}),
     *    @Response(403, body={"error": {"message": "Refund is not possible for goal owner!", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Goal is already paid out.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "One or more transactions have been already processed.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request available only for already paid transactions.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request available only after 2 days after transaction has been paid.", "status_code": 403}}),
     *    @Response(403, body={"error": {"message": "Refund Request is not available because fee is grater than refund amount.", "status_code": 403}})
     * })
     * @param CreateTransactionsRefundRequest $request
     * @return \Dingo\Api\Http\Response
     */
    public function store(CreateTransactionsRefundRequest $request)
    {
        $transactions = $this->authorizeTransactions($request);

        $refund = (new RefundsCalculator($transactions))->prepare();

        if (! $refund['allowed']) {
            throw new AccessDeniedHttpException("Refund Request is not available because fee is grater than refund amount.");
        }

        foreach ($refund['transactions'] as $key => $calculator) {
            $transaction = Transaction::with('goal')->find($key);
            RefundTransaction::dispatch($transaction, $calculator)->onQueue('billing');
        }

        return response()->json([
            'message' => 'Success - Your request has been set to queue and will be processed soon.'
        ], 200);
    }

    private function authorizeTransactions($request)
    {
        $user = $request->user();

        $transactions = $user->transactions()->whereIn('id', $request->transactions)->get();

        $count = $transactions->count();

        if (count($request->transactions) != $count) {
            $missed = implode(', ', array_diff($request->transactions, $transactions->pluck('id')->toArray()));
            throw new NotFoundHttpException("Transactions with id: {$missed} not found.");
        }

        foreach ($transactions as $transaction) {
            $this->authorize('refund', $transaction);
        }

        return $transactions;
    }
}