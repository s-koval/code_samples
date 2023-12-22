<?php

namespace App\Api\V1\Controllers\Goals;

use App\Api\V1\Transformers\GoalTransformer;
use App\Goal;
use App\Http\Controllers\Controller;
use App\Notifications\Goals\GoalHasBeenArchived;
use Dingo\Api\Routing\Helpers;
use HttpException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @Resource("Goals", uri="/api/v1/goals")
 */
class ArchiveGoalController extends Controller
{
    use Helpers;

    /**
     * Switch goal status to archive
     *
     * @Patch("goal/{id}/archive")
     * @Versions({"v1"})
     * @Transaction({
     *      @Request(headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *      @Response(
     *                  200,
     *                  body={
     *                      "message": "Success - Goal has been archived.",
     *                      "data": {
     *                          "id": 1,
     *                          "user_id": 1,
     *                          "status": "archived",
     *                          "name": "Goal name",
     *                          "images": null,
     *                          "deadline": "2018-11-11",
     *                          "privacy": "public",
     *                          "category_id": 2,
     *                          "other_category": null,
     *                          "total": 2000,
     *                          "total_paid": 2000,
     *                          "is_contributor": false,
     *                          "charge_fee": false,
     *                          "percentages_display": true,
     *                          "created_at": "2018-11-05 11:40:35",
     *                          "updated_at": "2018-11-05 11:40:35",
     *                          "members": {
     *                              {
     *                                  "id": 2,
     *                                  "first_name": "Beth",
     *                                  "last_name": "Kihn",
     *                                  "email": "bet_kihn@paydby.com",
     *                                  "avatars": {
     *                                      "original": ".../storage/original/default.jpg",
     *                                      "thumbnail": ".../storage/150/default.jpg",
     *                                      "small": ".../storage/300/default.jpg",
     *                                      "medium": ".../storage/600/default.jpg",
     *                                      "large": ".../storage/1200/default.jpg",
     *                                  },
     *                                  "is_accepted": true,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": 1000,
     *                              },
     *                              {
     *                                  "id": 3,
     *                                  "first_name": "Rusty",
     *                                  "last_name": "Mertz",
     *                                  "email": "r_mertz@paydby.com",
     *                                  "avatars": {
     *                                      "original": ".../storage/original/default.jpg",
     *                                      "thumbnail": ".../storage/150/default.jpg",
     *                                      "small": ".../storage/300/default.jpg",
     *                                      "medium": ".../storage/600/default.jpg",
     *                                      "large": ".../storage/1200/default.jpg",
     *                                  },
     *                                  "is_accepted": true,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": 1000,
     *                              },
     *                          },
     *                          "contributions": {
     *                              {
     *                                  "id": 1,
     *                                  "user_id": 2,
     *                                  "first_name": "Beth",
     *                                  "last_name": "Kihn",
     *                                  "avatars": {
     *                                      "original": ".../storage/original/default.jpg",
     *                                      "thumbnail": ".../storage/150/default.jpg",
     *                                      "small": ".../storage/300/default.jpg",
     *                                      "medium": ".../storage/600/default.jpg",
     *                                      "large": ".../storage/1200/default.jpg",
     *                                  },
     *                                  "paid_date": "2018-11-12 12:10:14",
     *                                  "amount": 1000,
     *                                  "goal_is_completed": true
     *                              },
     *                              {
     *                                  "id": 2,
     *                                  "user_id": 3,
     *                                  "first_name": "Rusty",
     *                                  "last_name": "Mertz",
     *                                  "avatars": {
     *                                      "original": ".../storage/original/default.jpg",
     *                                      "thumbnail": ".../storage/150/default.jpg",
     *                                      "small": ".../storage/300/default.jpg",
     *                                      "medium": ".../storage/600/default.jpg",
     *                                      "large": ".../storage/1200/default.jpg",
     *                                  },
     *                                  "paid_date": "2018-11-12 07:08:55" ,
     *                                  "amount": 1000,
     *                                  "goal_is_completed": true
     *                              },
     *                          }
     *                      }
     *                  }
     *     ),
     *      @Response(404, body={"error": {"message": "Goal with this ID not found.", "status_code": 404}}),
     *      @Response(403, body={"error": {"message": "403 Forbidden", "status_code": 403}}),
     *      @Response(403, body={"error": {"message": "This goal is already archived.", "status_code": 403}}),
     *      @Response(500, body={"error": {"message": "When archiving a goal, a server error occurred.", "status_code": 500}}),
     * })
     * @param Request $request
     * @param $id
     * @return \Dingo\Api\Http\Response
     * @throws HttpException
     */
    public function archive(Request $request, $id)
    {
        $goal = Goal::find($id);
        if (! $goal) {
            throw new NotFoundHttpException('Goal with this ID not found.');
        }

        if (! $request->user()->isGoalOwner($goal)) {
            throw new AccessDeniedHttpException();
        }

        if ($goal->isArchived()) {
            throw new AccessDeniedHttpException('This goal is already archived.');
        }

        $goal->status = 'archived';
        if (! $goal->save()) {
            throw new HttpException(500, 'When archiving a goal, a server error occurred.');
        }
        $goal->owner->notify((new GoalHasBeenArchived($goal))->onQueue('emails'));
        return $this->response()
            ->item($goal->fresh()->load('members', 'category'), new GoalTransformer())
            ->setMeta(['message' => 'Success - Goal has been archived.'])
            ->setStatusCode(200);
    }
}