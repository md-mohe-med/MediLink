<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LabUpload extends Model
{
    use HasFactory;

    protected $table = 'lab_uploads';

    protected $fillable = [
        'lab_id',
        'patient_id',
        'document_type',
        'title',
        'description',
        'file_path',
        'test_date',
    ];

    protected $casts = [
        'test_date' => 'date',
    ];

    // ─── Relationships ─────────────────────────────

    // LabUpload belongs to a Lab
    public function lab()
    {
        return $this->belongsTo(User::class, 'lab_id');
    }

    // LabUpload belongs to a Patient
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}