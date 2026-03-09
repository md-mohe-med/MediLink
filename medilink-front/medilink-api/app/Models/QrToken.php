<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QrToken extends Model
{
    use HasFactory;

    protected $table = 'qr_tokens';

    protected $fillable = [
        'patient_id',
        'token',
        'expires_at',
        'used_by',
        'used_at',
        'is_active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
        'is_active'  => 'boolean',
    ];

    // ─── Relationships ─────────────────────────────

    // QrToken belongs to a Patient
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    // QrToken was used by a Doctor
    public function usedBy()
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    // ─── Helper Methods ────────────────────────────

    // Check if token is expired
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    // Check if token is valid
    public function isValid()
    {
        return $this->is_active && !$this->isExpired();
    }
}