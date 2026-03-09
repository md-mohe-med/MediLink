<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // ─── Relationships ───────────────────────────────────

    public function patientProfile()
    {
        return $this->hasOne(PatientProfile::class);
    }

    public function doctorProfile()
    {
        return $this->hasOne(DoctorProfile::class);
    }

    public function labProfile()
    {
        return $this->hasOne(LabProfile::class);
    }

    public function patientDocuments()
    {
        return $this->hasMany(PatientDocument::class, 'patient_id');
    }

    public function labUploads()
    {
        return $this->hasMany(LabUpload::class, 'lab_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    public function qrTokens()
    {
        return $this->hasMany(QrToken::class, 'patient_id');
    }

    // ─── Role Helpers ────────────────────────────────────

    public function isPatient(): bool { return $this->role === 'patient'; }
    public function isDoctor(): bool  { return $this->role === 'doctor'; }
    public function isLab(): bool     { return $this->role === 'lab'; }
    public function isAdmin(): bool   { return $this->role === 'admin'; }
}