<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LabProfile extends Model
{
    use HasFactory;

    protected $table = 'lab_profiles';

    protected $fillable = [
        'user_id',
        'lab_name',
        'address',
        'working_hours',
        'logo',
        'official_doc',
        'about',
    ];

    // ─── Relationships ─────────────────────────────

    // LabProfile belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Lab has many uploads
    public function uploads()
    {
        return $this->hasMany(LabUpload::class, 'lab_id', 'user_id');
    }
}