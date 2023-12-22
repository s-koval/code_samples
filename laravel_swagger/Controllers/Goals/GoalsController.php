<?php

namespace App\Api\V1\Controllers\Goals;

use App\Api\V1\Requests\Authentication\CreateGoalRequest;
use App\Api\V1\Transformers\AnonymousGoalTransformer;
use App\Api\V1\Transformers\GoalTransformer;
use App\GalleryImage;
use App\Goal;
use App\Http\Controllers\Controller;
use App\Jobs\StoreImage;
use App\Notifications\Friends\PublicGoalCreated;
use App\Traits\PBHelper;
use Dingo\Api\Http\Request;
use Dingo\Api\Routing\Helpers;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @Resource("Goals", uri="/api/v1/goals")
 */
class GoalsController extends Controller
{
    use Helpers;
    use PBHelper;

    /**
     * Create a new goal
     *
     * @Post("/create")
     * @Versions({"v1"})
     * @Transaction({
     *      @Request(
     *          {
     *              "name": "Goal name",
     *              "image": "data:image/jpeg;base64,fskdkf...ksdkd=",
     *              "deadline": "2018-11-11",
     *              "privacy": "public|private",
     *              "is_contributor": "false",
     *              "category_id": 2,
     *              "total": 2000,
     *              "members": {
     *                  {
     *                      "email": "bet_kihn@paydby.com",
     *                      "contribution": 1000
     *                  },
     *                  {
     *                      "email": "r_mertz@paydby.com",
     *                      "contribution": 1000
     *                  },
     *              }
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *      @Response(
     *                  201,
     *                  body={
     *                      "message": "Success - Goal has been created.",
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
     *                          },
     *                          "contributions": {},
     *                          "messages": {}
     *                      }
     *                  }
     *      ),
     *      @Response(500, body={"error": {"message": "When creating a goal, a server error occurred.", "status_code": 500}}),
     *      @Request(
     *          {
     *              "name": "Goal name",
     *              "deadline": "2018-11-11",
     *              "gallery_image_id": 2,
     *              "privacy": "public|private",
     *              "is_contributor": "true",
     *              "charge_fee": true,
     *              "category_id": 2,
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
     *                      "first_name": "Rusty",
     *                      "last_name": "Mertz",
     *                      "email": "r_mertz@test.com",
     *                      "contribution": 1000
     *                  },
     *              }
     *          }, headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *      @Response(
     *                  201,
     *                  body={
     *                      "message": "Success - Goal has been created.",
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
     *                          "total": 3000,
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
     *                                  "id": null,
     *                                  "first_name": "Rusty",
     *                                  "last_name": "Mertz",
     *                                  "email": "r_mertz@paydby.com",
     *                                  "avatars": null,
     *                                  "is_accepted": false,
     *                                  "contribution": 1000,
     *                                  "paid_contribution": null,
     *                              },
     *                          },
     *                          "contributions": {},
     *                          "messages": {}
     *                      }
     *                  }
     *      ),
     *      @Response(403, body={"error": {"message": "In order to create a goal you must add your bank account to profile.", "status_code": 403}}),
     *      @Response(500, body={"error": {"message": "When creating a goal, a server error occurred.", "status_code": 500}}),
     * })
     * @param CreateGoalRequest $request
     * @return \Dingo\Api\Http\Response
     */
    public function store(CreateGoalRequest $request)
    {
        $user = \Auth::guard('api')->user();

        if (! $user->has_bank_account) {
            throw new AccessDeniedHttpException('In order to create a goal you must add your bank account to profile.');
        }

        $goal = $user->myGoals()->create($request->all());

        if (! $goal) {
            throw new HttpException(500, 'When creating a goal, a server error occurred.');
        }

        if($request->exists('gallery_image_id')) {
            $goal->image = GalleryImage::findOrFail($request->gallery_image_id)->image;
            $goal->save();
        }

        if($request->exists('image')) {
            $this->dispatch((new StoreImage($goal, $request->image))->onQueue('images'));
        }

        foreach ($request->members as $member) {
            $goal->attachMemberToGoal($member);
        }

        if($goal->isPublic()) {
            $user->notifyFriends(PublicGoalCreated::class, ['goal' => $goal, 'friend' => $user]);
        }

        return $this->response()
                ->item($goal->fresh()->load('members', 'pendingMembers', 'category'), new GoalTransformer())
                ->setMeta(['message' => 'Success - Goal has been created.'])
                ->setStatusCode(201);
    }

    /**
     * Get the list of goals for current user
     *
     * @Get("/my-goals/{?status,search,page}")
     * @Versions({"v1"})
     * @Parameters({
     *      @Parameter("status", description="Get the list of archived goals for current user", example="archived"),
     *      @Parameter("search", description="Get the list of goals by search query"),
     *      @Parameter("page", description="Allow to get another page by number", type="integer", example=2)
     * })
     * @Transaction({
     *    @Request(headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *    @Response(
     *                200,
     *                body={
     *                    "message": "Success - Goals found.",
     *                    "data": {
     *                        {
     *                            "id": 1,
     *                            "user_id": 1,
     *                            "status": "active",
     *                            "name": "Goal name",
     *                            "images": {
     *                                "original": ".../storage/original/SADJDJDJAH88asdaASfdf.jpg",
     *                                "thumbnail": ".../storage/150/SADJDJDJAH88asdaASfdf.jpg",
     *                                "small": ".../storage/300/SADJDJDJAH88asdaASfdf.jpg",
     *                                "medium": ".../storage/600/SADJDJDJAH88asdaASfdf.jpg",
     *                                "large": ".../storage/1200/SADJDJDJAH88asdaASfdf.jpg",
     *                            },
     *                            "deadline": "2018-11-11",
     *                            "privacy": "public",
     *                            "category_id": 2,
     *                            "other_category": null,
     *                            "total": 2000,
     *                            "total_paid": 50.00,
     *                            "is_contributor": false,
     *                            "charge_fee": false,
     *                            "percentages_display": true,
     *                            "created_at": "2018-11-05 11:40:35",
     *                            "updated_at": "2018-11-05 11:40:35",
     *                            "members": {
     *                                {
     *                                    "id": 2,
     *                                    "first_name": "Beth",
     *                                    "last_name": "Kihn",
     *                                    "email": "bet_kihn@paydby.com",
     *                                    "avatars": {
     *                                        "original": ".../storage/original/default.jpg",
     *                                        "thumbnail": ".../storage/150/default.jpg",
     *                                        "small": ".../storage/300/default.jpg",
     *                                        "medium": ".../storage/600/default.jpg",
     *                                        "large": ".../storage/1200/default.jpg",
     *                                    },
     *                                    "is_accepted": true,
     *                                    "contribution": 1000,
     *                                    "paid_contribution": 50,
     *                                },
     *                                {
     *                                    "id": 3,
     *                                    "first_name": "Rusty",
     *                                    "last_name": "Mertz",
     *                                    "email": "r_mertz@paydby.com",
     *                                    "avatars": {
     *                                        "original": ".../storage/original/default.jpg",
     *                                        "thumbnail": ".../storage/150/default.jpg",
     *                                        "small": ".../storage/300/default.jpg",
     *                                        "medium": ".../storage/600/default.jpg",
     *                                        "large": ".../storage/1200/default.jpg",
     *                                    },
     *                                    "is_accepted": false,
     *                                    "contribution": 1000,
     *                                    "paid_contribution": null,
     *                                },
     *                            },
     *                            "contributions": {
     *                                {
     *                                    "id": 1,
     *                                    "user_id": 2,
     *                                    "first_name": "Beth",
     *                                    "last_name": "Kihn",
     *                                    "avatars": {
     *                                        "original": ".../storage/original/default.jpg",
     *                                        "thumbnail": ".../storage/150/default.jpg",
     *                                        "small": ".../storage/300/default.jpg",
     *                                        "medium": ".../storage/600/default.jpg",
     *                                        "large": ".../storage/1200/default.jpg",
     *                                    },
     *                                    "paid_date": "2018-11-12 12:10:14",
     *                                    "amount": 30,
     *                                    "goal_is_completed": false
     *                                },
     *                                {
     *                                    "id": 2,
     *                                    "user_id": 2,
     *                                    "first_name": "Beth",
     *                                    "last_name": "Kihn",
     *                                    "avatars": {
     *                                        "original": ".../storage/original/default.jpg",
     *                                        "thumbnail": ".../storage/150/default.jpg",
     *                                        "small": ".../storage/300/default.jpg",
     *                                        "medium": ".../storage/600/default.jpg",
     *                                        "large": ".../storage/1200/default.jpg",
     *                                    },
     *                                    "paid_date": "2018-11-12 07:08:55",
     *                                    "amount": 20,
     *                                    "goal_is_completed": false
     *                                },
     *                            },
     *                            "messages": {}
     *                        }
     *                    },
     *                    "meta": {
     *                        "pagination": {
     *                            "total": 1,
     *                            "count": 1,
     *                            "per_page": 5,
     *                            "current_page": 1,
     *                            "total_pages": 1,
     *                            "links": {}
     *                        }
     *                    }
     *                }
     *    ),
     *    @Response(404, body={"error": {"message": "You don't have any archived goals.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "There are no goals matching your query.", "status_code": 404}}),
     *    @Response(404, body={"error": {"message": "You don't have any active goals", "status_code": 404}})
     * })
     * @param Request $request
     * @return \Dingo\Api\Http\Response
     */
    public function byUser(Request $request)
    {
        $user = $request->user();

        if (! empty($request->status) && $request->status === 'archived') {
            $goals = Cache::remember(
                    "archived_goals_for_member_{$user->id}",
                        config('cache.expire'),
                        function () use ($user) {
                            return $user->getAllMyGoals('archived')->load(['members', 'transactions'])->sortByDesc('deadline');
                        });

            if ($goals->count() > 0) {
                return $this->response()->paginator(
                            $this->paginateCollection($goals, 5),
                            new GoalTransformer()
                        )->setMeta(['message' => 'Success - Goals found.']);
            } else {
                throw new NotFoundHttpException('You don\'t have any archived goals.');
            }
        } else if (! empty($request->search)) {
            $goals = Cache::tags('searched_goals_list')->remember(
                            request()->fullUrl(),
                            config('cache.expire'),
                            function () use ($request, $user) {
                                $myGoals = $user->getAllMyGoals('active')->filter(function ($goal) use ($request) {
                                    return strpos($goal->name, $request->search) !== false;
                                })->load(['members', 'transactions'])->sortBy('deadline')->keyBy('id');

                                $publicGoals = Goal::public()
                                    ->matchesQuery($request->search)
                                    ->with(['members', 'transactions'])
                                    ->orderBy('deadline')
                                    ->get()
                                    ->reject(function ($goal) {
                                        return $goal->status == 'archived';
                                    })
                                    ->keyBy('id');
                                return $myGoals->merge($publicGoals);
                            });
            if ($goals->count() > 0) {
                return $this->response()->paginator(
                            $this->paginateCollection($goals, 5),
                            new GoalTransformer()
                        )->setMeta(['message' => 'Success - Goals found.']);
            } else {
                throw new NotFoundHttpException('There are no goals matching your query.');
            }
        } else {
            $goals = Cache::remember(
                "active_goals_for_member_{$user->id}",
                    config('cache.expire'),
                    function () use ($user) {
                        return $user->getAllMyGoals('active')->load(['members', 'transactions'])->sortBy('deadline');
                    });
            if ($goals->count() > 0) {
                return $this->response()->paginator(
                            $this->paginateCollection($goals, 5),
                            new GoalTransformer()
                        )->setMeta(['message' => 'Success - Goals found.']);
            } else {
                throw new NotFoundHttpException('You don\'t have any active goals.');
            }
        }
    }

    /**
     * Get the info for current goal
     *
     * @Get("/goal/{id}")
     * @Versions({"v1"})
     * @Transaction({
     *    @Request(headers={"Authorization": "Bearer {JWT_TOKEN}", "Accept": "application/vnd.paydby-app.v1+json"}),
     *    @Response(
     *                200,
     *                body={
     *                    "message": "Success - Goal found.",
     *                    "data": {
     *                        "id": 1,
     *                        "user_id": 1,
     *                        "status": "active",
     *                        "name": "Goal name",
     *                        "images": null,
     *                        "deadline": "2018-11-11",
     *                        "privacy": "public",
     *                        "category_id": 2,
     *                        "other_category": null,
     *                        "total": 2000,
     *                        "total_paid": 50.00,
     *                        "is_contributor": false,
     *                        "charge_fee": false,
     *                        "percentages_display": true,
     *                        "created_at": "2018-11-05 11:40:35",
     *                        "updated_at": "2018-11-05 11:40:35",
     *                        "members": {
     *                            {
     *                                "id": 2,
     *                                "first_name": "Beth",
     *                                "last_name": "Kihn",
     *                                "email": "bet_kihn@paydby.com",
     *                                "avatars": {
     *                                    "original": ".../storage/original/default.jpg",
     *                                    "thumbnail": ".../storage/150/default.jpg",
     *                                    "small": ".../storage/300/default.jpg",
     *                                    "medium": ".../storage/600/default.jpg",
     *                                    "large": ".../storage/1200/default.jpg",
     *                                },
     *                                "is_accepted": true,
     *                                "contribution": 1000,
     *                                "paid_contribution": 50,
     *                            },
     *                            {
     *                                "id": 3,
     *                                "first_name": "Rusty",
     *                                "last_name": "Mertz",
     *                                "email": "r_mertz@paydby.com",
     *                                "avatars": {
     *                                    "original": ".../storage/original/default.jpg",
     *                                    "thumbnail": ".../storage/150/default.jpg",
     *                                    "small": ".../storage/300/default.jpg",
     *                                    "medium": ".../storage/600/default.jpg",
     *                                    "large": ".../storage/1200/default.jpg",
     *                                },
     *                                "is_accepted": false,
     *                                "contribution": 1000,
     *                                "paid_contribution": null,
     *                            },
     *                        },
     *                        "contributions": {
     *                            {
     *                                "id": 1,
     *                                "user_id": 2,
     *                                "first_name": "Beth",
     *                                "last_name": "Kihn",
     *                                "avatars": {
     *                                    "original": ".../storage/original/default.jpg",
     *                                    "thumbnail": ".../storage/150/default.jpg",
     *                                    "small": ".../storage/300/default.jpg",
     *                                    "medium": ".../storage/600/default.jpg",
     *                                    "large": ".../storage/1200/default.jpg",
     *                                },
     *                                "paid_date": "2018-11-12 12:10:14",
     *                                "amount": 30,
     *                                "goal_is_completed": false
     *                            },
     *                            {
     *                                "id": 2,
     *                                "user_id": 2,
     *                                "first_name": "Beth",
     *                                "last_name": "Kihn",
     *                                "avatars": {
     *                                    "original": ".../storage/original/default.jpg",
     *                                    "thumbnail": ".../storage/150/default.jpg",
     *                                    "small": ".../storage/300/default.jpg",
     *                                    "medium": ".../storage/600/default.jpg",
     *                                    "large": ".../storage/1200/default.jpg",
     *                                },
     *                                "paid_date": "2018-11-12 07:08:55" ,
     *                                "amount": 20,
     *                                "goal_is_completed": false
     *                            },
     *                        },
     *                        "messages": {}
     *                    }
     *                }
     *    ),
     *    @Response(
     *                200,
     *                body={
     *                    "message": "Success - Goal found.",
     *                    "data": {
     *                        "id": 1,
     *                        "user_id": 1,
     *                        "name": "Goal name",
     *                        "images": {
     *                            "original": ".../storage/original/SADJDJDJAH88asdaASfdf.jpg",
     *                            "thumbnail": ".../storage/150/SADJDJDJAH88asdaASfdf.jpg",
     *                            "small": ".../storage/300/SADJDJDJAH88asdaASfdf.jpg",
     *                            "medium": ".../storage/600/SADJDJDJAH88asdaASfdf.jpg",
     *                            "large": ".../storage/1200/SADJDJDJAH88asdaASfdf.jpg",
     *                        },
     *                        "deadline": "2018-11-11",
     *                        "privacy": "public",
     *                        "category_id": 2,
     *                        "other_category": null,
     *                        "total": 2000,
     *                        "total_paid": 50.00,
     *                        "created_at": "2018-11-05 11:40:35",
     *                        "updated_at": "2018-11-05 11:40:35",
     *                        "members": {
     *                            {
     *                                "id": 2,
     *                                "first_name": "Beth",
     *                                "last_name": "Kihn",
     *                                "avatars": {
     *                                    "original": ".../storage/original/default.jpg",
     *                                    "thumbnail": ".../storage/150/default.jpg",
     *                                    "small": ".../storage/300/default.jpg",
     *                                    "medium": ".../storage/600/default.jpg",
     *                                    "large": ".../storage/1200/default.jpg",
     *                                },
     *                                "contribution": 1000,
     *                                "paid_contribution": 50.00,
     *                            },
     *                        }
     *                    }
     *                }
     *    ),
     *    @Response(404, body={"error": {"message": "Goal with this ID does not exist.", "status_code": 404}}),
     * })
     * @param Request $request
     * @param $id
     * @return \Dingo\Api\Http\Response
     */
    public function show(Request $request, $id)
    {
        $goal = Cache::remember(
                "goal_{$id}_info",
                    config('cache.expire'),
                    function() use ($id) {
                        return Goal::with(['members', 'pendingMembers', 'category', 'transactions'])->find($id);
                    });
        if (! $goal) {
            throw new NotFoundHttpException('Goal with this ID does not exist.');
        }

        if ($request->user()->belongsToGoal($goal)) {
            return $this->response()->item($goal, new GoalTransformer())->setMeta(['message' => 'Success - Goal found.']);
        } else {
            if (! $goal->isPublic()) {
                throw new NotFoundHttpException('Goal with this ID does not exist.');
            }

            $goal->members = $goal->members->filter(function ($member) {
                return $member->pivot->is_accepted;
            });
            return $this->response()->item($goal, new AnonymousGoalTransformer())->setMeta(['message' => 'Success - Goal found.']);
        }
    }

    public function paginateCollection($collection, $perPage, $total = null, $page = null, $pageName = 'page' )
    {
        $page = $page ?: LengthAwarePaginator::resolveCurrentPage( $pageName );

        return new LengthAwarePaginator( $collection->forPage( $page, $perPage ), $total ?: $collection->count(), $perPage, $page, [
            'path' => LengthAwarePaginator::resolveCurrentPath(),
            'pageName' => $pageName,
        ]);
    }
}