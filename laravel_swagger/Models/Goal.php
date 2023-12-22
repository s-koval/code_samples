<?php

namespace App;

use App\Traits\Goals\HasMembers;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Goal extends Model
{
    use Notifiable;
    use SoftDeletes;
    use HasMembers;

    protected $fillable = [
        'name',
        'deadline',
        'privacy',
        'category_id',
        'type',
        'frequency',
        'total',
        'is_contributor',
        'charge_fee',
        'percentages_display'
    ];

    protected $casts = [
        'is_contributor' => 'bool',
        'charge_fee' => 'bool',
        'percentages_display' => 'bool',
        'is_paid_out' => 'bool',
        'is_completed' => 'bool',
        'total' => 'float',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
        'deadline'
    ];

    protected $appends = [
        'images'
    ];

    protected $hidden = [
        'image'
    ];

    public function getImageAttribute($value) {
        if ($value) {
            return 'original/' . $value;
        }
    }

    public function getImagesAttribute()
    {
        $img = $this->image ? $this->getOriginal('image') : null;
        return $img ? getImagesUrl($img) : null;
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'goal_member', 'goal_id', 'user_id')->withPivot([
            'is_accepted',
            'contribution',
            'paid_contribution'
        ])->withTimestamps();
    }

    public function pendingMembers()
    {
        return $this->hasMany(PendingMember::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function contributions()
    {
        return $this->hasMany(Contribution::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function requests()
    {
        return $this->belongsToMany(User::class, 'goal_requests')->withTimestamps();
    }

    /**
     * Get only active goals
     *
     * @param $query
     * @return mixed
     */
    public function scopeActive($query)
    {
        return $query->whereStatus('active');
    }

    /**
     * Get only archived goals
     *
     * @param $query
     * @return mixed
     */
    public function scopeArchived($query)
    {
        return $query->whereStatus('archived');
    }

    /**
     * Get only public goals
     *
     * @param $query
     * @return mixed
     */
    public function scopePublic($query)
    {
        return $query->wherePrivacy('public');
    }

    /**
     * Get only private goals
     *
     * @param $query
     * @return mixed
     */
    public function scopePrivate($query)
    {
        return $query->wherePrivacy('private');
    }


    /**
     * Get goals filtered by search query
     *
     * @param $query
     * @param $search
     * @return mixed
     */
    public function scopeMatchesQuery($query, $search)
    {
        $data = 'lower(CONCAT(goals.name, "", users.first_name, "", users.last_name, "", users.email)) like ?';

        $query->select('goals.*', 'users.first_name', 'users.last_name', 'users.email')
              ->leftJoin('users', 'users.id', '=', 'goals.user_id')
              ->where('goals.name', 'LIKE', "%{$search}%")
              ->orWhere(function ($goal) use ($search, $data) {
                            $search = explode(' ', $search);
                            while (count($search) > 0) {
                                if (strlen($search[0]) > 2) {
                                    $condition = '%' . strtolower($search[0]) . '%';
                                    $goal->orWhereRaw($data, [$condition]);
                                }
                                array_shift($search);
                            }
                       });
        return $query;
    }

    public function formatCategory()
    {
        if (! empty($this->category)) {
            return [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ];
        } else {
            return null;
        }
    }

    public function isCompleted()
    {
        return $this->members->sum('pivot.paid_contribution') == $this->total;
    }

    public function deadlineIsToday()
    {
        return $this->deadline == Carbon::today();
    }

    public function isPublic()
    {
        return $this->privacy === 'public';
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isArchived()
    {
        return $this->status === 'archived';
    }

    public function getPaymentDescription()
    {
        return "Payment for goal: {$this->name}";
    }

    public function getTotalPaid()
    {
        $sum = $this->transactions->filter(function ($transaction) {
            return $transaction->status == Transaction::PAID_STATUS || $transaction->status == Transaction::PAID_OUT_STATUS;
        })->sum('amount');

        return round($sum, 2);
    }
}
