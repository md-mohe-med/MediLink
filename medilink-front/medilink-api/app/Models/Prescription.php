<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Prescription extends Model
{
    use HasFactory;

    protected $table = 'prescriptions';

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'medications',
        'notes',
        'prescription_date',
    ];

    protected $casts = [
        'medications'       => 'array',
        'prescription_date' => 'date',
    ];

    // ─── Relationships ─────────────────────────────

    // Prescription belongs to a Doctor
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    // Prescription belongs to a Patient
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}