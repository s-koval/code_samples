<?php

namespace App\Api\V1\Controllers\Goals;

use App\Api\V1\Requests\Goals\UpdateGoalRequest;
use App\Api\V1\Transformers\GoalTransformer;
use App\GalleryImage;
use App\Goal;
use App\Http\Controllers\Controller;
use App\Jobs\StoreImage;
use App\Notifications\Friends\FriendUpdatedCoverPhoto;
use App\Notifications\Goals\RelatedGoalHasBeenUpdated;
use Dingo\Api\Routing\Helpers;
use HttpException;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @Resource("Goals", uri="/api/v1/goals")
 */
class UpdateGoalController extends Controller
{
    use Helpers;

    /**
     * Update the goal by given ID
     *
     * @Put("goal/{id}/update")
     * @Versions({"v1"})
     * @Transaction({
     *      @Request(
     *          {
     *              "name": "Goal name",
     *              "deadline": "2018-11-11",
     *              "privacy": "public|private",
     *              "category_id": 2,
     *              "is_contributor": "false",
     *              "total": 2500,
     *              "members": {
     *                  {
     *                      "email": "bet_kihn@paydby.com",
     *                      "contribution": 1000
     *                  },
     *                  {
     *                      "email": "r_mertz@paydby.com",
     *                      "contribution": 1000
     *                  },
     *                  {
     *                      "first_name": "Foo",
     *                      "last_name": "Bar",
     *                      "email": "foo@bar.com",
     *                      "contribution": 500
     *                  },
     *              }
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json", "Content-Type": "application/json"}),
     *      @Response(
     *                  200,
     *                  body={
     *                      "message": "Success - Goal has been updated.",
     *                      "data": {
     *                          "id": 1,
     *                          "user_id": 1,
     *                          "status": "active",
     *                          "name": "Goal name",
     *                          "images": null,
     *                          "deadline": "2018-11-11",
     *                          "privacy": "public",
     *                          "category_id": 2,
     *                          "other_category": null,
     *                          "total": 2000,
     *                          "total_paid": 0,
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
     *                                  "is_accepted": false,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
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
     *                                  "is_accepted": false,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
     *                              },
     *                              {
     *                                  "id": null,
     *                                  "first_name": "Foo",
     *                                  "last_name": "Bar",
     *                                  "email": "foo@bar.com",
     *                                  "avatars": null,
     *                                  "is_accepted": false,
     *                                  "contribution": 500,
     *                                  "paid_contribution": null,
     *                              },
     *                          },
     *                          "contributions": {}
     *                      }
     *                  }
     *     ),
     *      @Request(
     *          {
     *              "name": "Goal name",
     *              "image": "data:image/jpeg;base64,fskdkf...ksdkd=",
     *              "deadline": "2018-11-11",
     *              "privacy": "public|private",
     *              "category_id": 2,
     *              "is_contributor": "true",
     *              "charge_fee": true,
     *              "total": 3000,
     *              "members": {
     *                  {
     *                      "email": "john@smith.co",
     *                      "contribution": 1000
     *                  },
     *                  {
     *                      "email": "bet_kihn@paydby.com",
     *                      "contribution": 1000
     *                  },
     *                  {
     *                      "email": "r_mertz@paydby.com",
     *                      "contribution": 1000
     *                  },
     *              }
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json", "Content-Type": "application/json"}),
     *      @Response(
     *                  200,
     *                  body={
     *                      "message": "Success - Goal has been updated.",
     *                      "data": {
     *                          "id": 1,
     *                          "user_id": 1,
     *                          "status": "active",
     *                          "name": "Goal name",
     *                          "images": {
     *                              "original": ".../storage/original/SADJDJDJAH88asdaASfdf.jpg",
     *                              "thumbnail": ".../storage/150/SADJDJDJAH88asdaASfdf.jpg",
     *                              "small": ".../storage/300/SADJDJDJAH88asdaASfdf.jpg",
     *                              "medium": ".../storage/600/SADJDJDJAH88asdaASfdf.jpg",
     *                              "large": ".../storage/1200/SADJDJDJAH88asdaASfdf.jpg",
     *                          },
     *                          "deadline": "2018-11-11",
     *                          "privacy": "public",
     *                          "category_id": 2,
     *                          "other_category": null,
     *                          "total": 2000,
     *                          "total_paid": 0,
     *                          "is_contributor": true,
     *                          "charge_fee": true,
     *                          "percentages_display": true,
     *                          "created_at": "2018-11-05 11:40:35",
     *                          "updated_at": "2018-11-05 11:40:35",
     *                          "members": {
     *                              {
     *                                  "id": 1,
     *                                  "first_name": "John",
     *                                  "last_name": "Smith",
     *                                  "email": "john@smith.co",
     *                                  "avatars": {
     *                                      "original": ".../storage/original/default.jpg",
     *                                      "thumbnail": ".../storage/150/default.jpg",
     *                                      "small": ".../storage/300/default.jpg",
     *                                      "medium": ".../storage/600/default.jpg",
     *                                      "large": ".../storage/1200/default.jpg",
     *                                  },
     *                                  "is_accepted": true,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
     *                              },
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
     *                                  "is_accepted": false,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
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
     *                                  "is_accepted": false,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
     *                              },
     *                          },
     *                          "contributions": {}
     *                      }
     *                  }
     *     ),
     *      @Response(404, body={"error": {"message": "Goal with this ID not found.", "status_code": 404}}),
     *      @Response(403, body={"error": {"message": "403 Forbidden", "status_code": 403}}),
     *      @Response(403, body={"error": {"message": "This goal is archived.", "status_code": 403}}),
     *      @Response(500, body={"error": {"message": "When updating a goal, a server error occurred.", "status_code": 500}}),
     * })
     * @param UpdateGoalRequest $request
     * @param $id
     * @return \Dingo\Api\Http\Response
     * @throws HttpException
     */
    public function update(UpdateGoalRequest $request, $id)
    {
        $goal = Goal::find($id);
        $user = $request->user();

        if (! $goal) {
            throw new NotFoundHttpException('Goal with this ID not found.');
        }

        if (! $user->isGoalOwner($goal)) {
            throw new AccessDeniedHttpException();
        }

        if ($goal->isArchived()) {
            throw new AccessDeniedHttpException('This goal is archived.');
        }

        $actualMembers = collect($request->members);
        $removedMembers = $goal->collectRemovedMembers($actualMembers);
        $goal->checkRemovedMembers($removedMembers);

        if (! $goal->update($request->all())) {
            throw new HttpException(500, 'When updating a goal, a server error occurred.');
        }

        if($request->exists('gallery_image_id')) {
            $goal->image = GalleryImage::findOrFail($request->gallery_image_id)->image;
            $goal->save();
            if ($goal->isPublic()) {
                $goal->owner->notifyFriends(FriendUpdatedCoverPhoto::class, ['goal' => $goal, 'friend' => $goal->owner]);
            }
        }

        if ($request->exists('image')) {
            $this->dispatch((new StoreImage($goal, $request->image, $goal->getOriginal('image')))->onQueue('images'));
            if ($goal->isPublic()) {
                $goal->owner->notifyFriends(FriendUpdatedCoverPhoto::class, ['goal' => $goal, 'friend' => $goal->owner]);
            }
        }

        $goal->processActualMembers($actualMembers);
        $goal->detachMembersFromGoal($removedMembers->pluck('id'));
        $goal->pendingMembers()->whereNotIn('email', $actualMembers->pluck('email')->toArray())->delete();

        return $this->response()
            ->item($goal->fresh()->load('members', 'category'), new GoalTransformer())
            ->setMeta(['message' => 'Success - Goal has been updated.'])
            ->setStatusCode(200);

    }
}