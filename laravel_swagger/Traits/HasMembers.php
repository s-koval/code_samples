<?php

namespace App\Traits\Goals;

use App\Notifications\Goals\RelatedGoalHasBeenUpdated;
use App\Notifications\Users\NewUserInvitedToGoal;
use App\Notifications\Users\UserInvitedToGoal;
use App\User;
use Illuminate\Support\Facades\Notification;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

trait HasMembers
{
    public function collectRemovedMembers($actualMembers)
    {
        return $this->members()
                    ->whereNotIn('email', $actualMembers->pluck('email')->toArray())->get()
                    ->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'email' => $member->email,
                            'is_accepted' => $member->pivot->is_accepted,
                            'contribution' => $member->pivot->contribution,
                            'paid_contribution' => $member->pivot->paid_contribution,
                        ];
                });
    }

    public function checkRemovedMembers($removedMembers)
    {
        $accepted = $removedMembers->filter(function ($member) {
            return $member['is_accepted'];
        });

        if($count = $accepted->count()) {
            $plural = $count > 1;
            $message = sprintf(
                '%s email%s \'%s\' can not be removed from goal because %s already joined it.',
                  $plural ? 'Members with those' : 'Member with this',
                    $plural ? 's' : '',
                       $accepted->pluck('email')->implode(', '),
                       $plural ? 'they are' : 'he is');

            throw new AccessDeniedHttpException($message);
        }
    }

    public function processActualMembers($actualMembers)
    {
        foreach ($actualMembers as $member) {
            if ($existingMember = $this->members()->whereEmail($member['email'])->first()) {
                if ($existingMember->isGoalOwner($this) && $this->charge_fee) {
                    continue;
                }
                $this->members()->updateExistingPivot($existingMember->id, ['contribution' => $member['contribution']]);
                $existingMember->notify((new RelatedGoalHasBeenUpdated($this, true))->onQueue('emails'));
            } else {
                if ($pendingMember = $this->pendingMembers()->whereEmail($member['email'])->first()) {
                    $member = $this->formatPendingMember($member);
                    $pendingMember->contribution = $member['contribution'];
                    $pendingMember->first_name = $member['first_name'];
                    $pendingMember->last_name = $member['last_name'];
                    $pendingMember->save();
                    Notification::route('mail', $pendingMember->email)
                        ->notify((new RelatedGoalHasBeenUpdated($this, false))->onQueue('emails'));
                } else {
                    $this->attachMemberToGoal($member);
                }
            }
        }
    }

    public function attachMemberToGoal($member)
    {
        $existingMember = User::whereEmail($member['email'])->first();

        if ($existingMember) {
            if($existingMember->id === $this->owner->id) {
                $this->members()->attach($existingMember->id, ['is_accepted' => true, 'contribution' => $member['contribution']]);
            } else {
                $this->members()->attach($existingMember->id, ['contribution' => $member['contribution']]);
                $existingMember->notify((new UserInvitedToGoal($this))->onQueue('emails'));
            }
        } else {
            $member = $this->formatPendingMember($member);
            $this->pendingMembers()->create([
                'first_name' => $member['first_name'],
                'last_name' => $member['last_name'],
                'email' => $member['email'],
                'contribution' => $member['contribution']
            ]);
            Notification::route('mail', $member['email'])
                ->notify((new NewUserInvitedToGoal($this))->onQueue('emails'));
        }
    }

    public function detachMembersFromGoal($members) {
        foreach ($members as $id) {
            $this->members()->detach($id);
            $this->transactions()->pendingForUser($id)->delete();
        }
    }

    public function isFirstContribution() {
        return ! $this->members->sum('pivot.paid_contribution') > 0;
    }

    private function formatPendingMember($member)
    {
        return [
            'first_name' => ! empty($member['first_name']) ? $member['first_name'] : '',
            'last_name' => ! empty($member['last_name']) ? $member['last_name'] : '',
            'email' => $member['email'],
            'contribution' => ! empty($member['contribution']) ? $member['contribution'] : 0
        ];
    }
}