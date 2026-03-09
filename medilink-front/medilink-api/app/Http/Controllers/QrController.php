<?php

namespace App\Http\Controllers;

use App\Models\QrToken;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QrController extends Controller
{
    // ─── Generate a New QR Token (Patient) ────────────────────────
    public function generate(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can generate QR tokens.',
            ], 403);
        }

        // Invalidate previous tokens
        QrToken::where('patient_id', $user->id)
            ->update(['is_active' => false]);

        $token = Str::random(40);
        $expiresAt = now()->addMinutes(30);

        $qr = QrToken::create([
            'patient_id' => $user->id,
            'token'      => $token,
            'expires_at' => $expiresAt,
            'is_active'  => true,
        ]);

        return response()->json([
            'message'    => 'QR token generated successfully.',
            'token'      => $qr->token,
            'expires_at' => $qr->expires_at,
        ], 201);
    }

    // ─── Verify QR Token (Doctor) ─────────────────────────────────
    public function verify(Request $request)
    {
        $user = $request->user();

        if (!$user->isDoctor()) {
            return response()->json([
                'message' => 'Only doctors can verify QR tokens.',
            ], 403);
        }

        $request->validate([
            'token' => 'required|string',
        ]);

        $qr = QrToken::where('token', $request->token)->first();

        if (!$qr || !$qr->isValid()) {
            return response()->json([
                'message' => 'Invalid or expired QR token.',
            ], 422);
        }

        // Mark who used it and when (for auditing)
        if (!$qr->used_by) {
            $qr->used_by = $user->id;
            $qr->used_at = now();
            $qr->save();
        }

        $patient = $qr->patient()->with('patientProfile')->first();

        return response()->json([
            'message'    => 'QR token verified successfully.',
            'patient'    => [
                'id'          => $patient->id,
                'name'        => $patient->name,
                'role'        => $patient->role,
                'public_id'   => optional($patient->patientProfile)->patient_id,
            ],
            'expires_at' => $qr->expires_at,
        ]);
    }
}

