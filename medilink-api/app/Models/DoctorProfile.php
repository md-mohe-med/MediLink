<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DoctorProfile extends Model
{
    use HasFactory;

    protected $table = 'doctor_profiles';

    protected $fillable = [
        'user_id',
        'profile_picture',
        'specialization',
        'license_number',
        'license_file',
        'hospital_name',
        'years_of_experience',
        'about',
    ];

    protected $casts = [
        'years_of_experience' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────

    // DoctorProfile belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Doctor has many prescriptions
    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'doctor_id', 'user_id');
    }
}
