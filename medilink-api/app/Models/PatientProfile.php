<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PatientProfile extends Model
{
    use HasFactory;

    protected $table = 'patient_profiles';

    protected $fillable = [
        'user_id',
        'patient_id',
        'date_of_birth',
        'gender',
        'national_id',
        'profile_picture',
        'address',
        'blood_type',
        'height',
        'weight',
        'chronic_diseases',
        'allergies',
        'current_medications',
        'smoking_status',
        'notes',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'height'        => 'decimal:2',
        'weight'        => 'decimal:2',
    ];

    // ─── Relationships ─────────────────────────────

    // PatientProfile belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
