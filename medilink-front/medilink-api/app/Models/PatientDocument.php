<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PatientDocument extends Model
{
    use HasFactory;

    protected $table = 'patient_documents';

    protected $fillable = [
        'patient_id',
        'uploaded_by',
        'document_type',
        'title',
        'description',
        'file_path',
        'document_date',
    ];

    protected $casts = [
        'document_date' => 'date',
    ];

    // ─── Relationships ─────────────────────────────

    // Document belongs to a Patient
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    // Document was uploaded by a User (patient himself)
    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ─── Helper Methods ────────────────────────────

    // Check if uploaded by patient himself
    public function isUploadedByPatient()
    {
        return $this->patient_id === $this->uploaded_by;
    }
}