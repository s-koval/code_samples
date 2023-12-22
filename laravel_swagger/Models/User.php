<?php

namespace App;

use App\Traits\Users\HasFriends;
use App\Traits\Users\HasGoals;
use App\Traits\Users\HasContributions;
use App\Traits\Users\HasMessages;
use Hash;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    use Notifiable;
    use HasGoals;
    use HasContributions;
    use HasMessages;
    use HasFriends;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        // 'status',
        // 'level',
        'first_name',
        'last_name',
        'email',
        'password',
        'pin'
    ];

    protected $appends = [
        'avatars',
        'has_bank_account'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token', 'deleted_at', 'avatar', 'email_verified_at', 'notification_channel'
    ];


    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
        'email_verified_at'
    ];


    protected $touches = ['goals'];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function verification()
    {
        return $this->hasOne(UserVerification::class);
    }

    /**
     * Get name of user
     *
     * @return mixed|string
     */
    public function getNameAttribute()
    {
        return sprintf("%s %s", $this->first_name, $this->last_name);
    }

    public function getAvatarAttribute($value) {
        return $value ? 'original/' . $value : '';
    }

    public function getAvatarsAttribute()
    {
        $img = $this->avatar ? $this->getOriginal('avatar') : 'default.jpg';
        return getImagesUrl($img);
    }

    public function getHasBankAccountAttribute()
    {
        return !! $this->bankAccount()->count();
    }

    public function myGoals()
    {
        return $this->hasMany(Goal::class);
    }

    public function goals()
    {
        return $this->belongsToMany(Goal::class, 'goal_member', 'user_id', 'goal_id')->withPivot([
            'is_accepted',
            'contribution',
            'paid_contribution'
        ])->withTimestamps();
    }

    public function contributions()
    {
        return $this->hasMany(Contribution::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function bankAccount()
    {
        return $this->hasOne(BankAccount::class);
    }

    public function withdrawals()
    {
        return $this->hasMany(Withdrawal::class);
    }

    public function refunds()
    {
        return $this->hasMany(Refund::class);
    }

    public function requests()
    {
        return $this->belongsToMany(Goal::class, 'goal_requests')->withTimestamps();
    }

    public function gift()
    {
        return $this->hasOne(Gift::class);
    }

    /**
     * Automatically creates hash for the user password.
     *
     * @param  string $value
     * @return void
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    public function isAdmin()
    {
        return $this->level == 'admin';
    }

    public function scopeAdmins($query)
    {
        return $query->whereLevel('admin');
    }

    public function scopeMatchesQuery($query, $search)
    {
        $userData = 'lower(CONCAT(first_name, "", last_name, "", email)) like ?';
        $search = explode(' ', $search);
        return $query->where(function ($user) use ($search, $userData) {
            while (count($search) > 0) {
                $user->whereRaw($userData, ['%' . strtoupper($search[0]) . '%']);
                array_shift($search);
            }
        });
    }

    public function scopeWithoutMe($query, $me)
    {
        return $query->where('id', '!=', $me->id);
    }

    public function hasToken()
    {
        return !! $this->pin_token;
    }
}
