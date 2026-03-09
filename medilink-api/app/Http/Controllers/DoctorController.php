<?php

namespace App\Http\Controllers;

use App\Models\LabUpload;
use App\Models\Prescription;
use App\Models\QrToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DoctorController extends Controller
{
    // ─── Create Prescription for a Patient ───────────────────────
    public function storePrescription(Request $request)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json([
                'message' => 'Only doctors can create prescriptions.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id'        => 'required|exists:users,id',
            'medications'       => 'required|array|min:1',
            'medications.*.name'=> 'required|string|max:255',
            'medications.*.dose'=> 'required|string|max:255',
            'medications.*.frequency' => 'required|string|max:255',
            'medications.*.duration'  => 'required|string|max:255',
            'notes'             => 'nullable|string',
            'prescription_date' => 'nullable|date',
        ]);

        $prescription = Prescription::create([
            'doctor_id'        => $doctor->id,
            'patient_id'       => $validated['patient_id'],
            'medications'      => $validated['medications'],
            'notes'            => $validated['notes'] ?? null,
            'prescription_date'=> $validated['prescription_date'] ?? now(),
        ]);

        return response()->json([
            'message'      => 'Prescription created successfully.',
            'prescription' => $prescription,
        ], 201);
    }

    // ─── Get Patient File via Valid QR Session ───────────────────
    public function showPatient(Request $request, $patientId)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json([
                'message' => 'Only doctors can access patient files.',
            ], 403);
        }

        // Ensure there is an active, non‑expired QR session for this doctor + patient
        $hasValidQr = QrToken::where('patient_id', $patientId)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->where(function ($q) use ($doctor) {
                $q->whereNull('used_by')->orWhere('used_by', $doctor->id);
            })
            ->exists();

        if (!$hasValidQr) {
            return response()->json([
                'message' => 'QR session is missing or expired for this patient.',
            ], 403);
        }

        $patient = User::with(['patientProfile', 'patientDocuments'])
            ->where('id', $patientId)
            ->where('role', 'patient')
            ->firstOrFail();

        $prescriptions = Prescription::where('patient_id', $patient->id)
            ->with('doctor')
            ->orderByDesc('prescription_date')
            ->get();

        $labUploads = LabUpload::where('patient_id', $patient->id)
            ->orderByDesc('test_date')
            ->get();

        $documents = $patient->patientDocuments
            ->map(fn ($d) => [
                'id'             => $d->id,
                'title'          => $d->title,
                'description'    => $d->description,
                'document_type'  => $d->document_type,
                'document_date'  => $d->document_date,
                'file_path'      => $d->file_path,
            ])
            ->concat(
                $labUploads->map(fn ($d) => [
                    'id'             => 'lab_' . $d->id,
                    'title'          => $d->title,
                    'description'    => $d->description,
                    'document_type'  => $d->document_type,
                    'document_date'  => $d->test_date,
                    'file_path'      => $d->file_path,
                ])
            )
            ->sortByDesc('document_date')
            ->values();

        return response()->json([
            'patient'       => $patient,
            'profile'       => $patient->patientProfile,
            'prescriptions' => $prescriptions,
            'documents'     => $documents,
        ]);
    }

    // ─── Dashboard Stats & Activity ───────────────────────────────
    public function dashboard(Request $request)
    {
        $doctor = $request->user();

        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can access dashboard.'], 403);
        }

        $patientsAccessed = (int) QrToken::where('used_by', $doctor->id)
            ->whereNotNull('used_at')
            ->selectRaw('COUNT(DISTINCT patient_id) as c')
            ->value('c');

        $recentScans = QrToken::where('used_by', $doctor->id)
            ->whereNotNull('used_at')
            ->where('used_at', '>=', now()->subDays(30))
            ->count();

        $prescriptionsCount = Prescription::where('doctor_id', $doctor->id)->count();

        $qrActivities = QrToken::where('used_by', $doctor->id)
            ->whereNotNull('used_at')
            ->with('patient')
            ->orderByDesc('used_at')
            ->limit(15)
            ->get()
            ->map(fn ($qr) => [
                'id'       => 'qr_' . $qr->id,
                'type'     => 'qr_access',
                'icon'     => 'description',
                'color'    => '#2463eb',
                'bg'       => '#eff6ff',
                'title'    => 'Patient Record Accessed:',
                'name'     => $qr->patient->name ?? 'Unknown',
                'time'     => $qr->used_at->diffForHumans(),
                'location' => 'Provider Access',
                'raw_at'   => $qr->used_at->toIso8601String(),
            ]);

        $prescActivities = Prescription::where('doctor_id', $doctor->id)
            ->with('patient')
            ->orderByDesc('prescription_date')
            ->limit(15)
            ->get()
            ->map(fn ($p) => [
                'id'       => 'pr_' . $p->id,
                'type'     => 'prescription',
                'icon'     => 'check_circle',
                'color'    => '#16a34a',
                'bg'       => '#f0fdf4',
                'title'    => 'Prescription Issued:',
                'name'     => $p->patient->name ?? 'Unknown',
                'time'     => $p->prescription_date ? \Carbon\Carbon::parse($p->prescription_date)->diffForHumans() : '—',
                'location' => 'Consultation',
                'raw_at'   => $p->prescription_date,
            ]);

        $activities = collect([...$qrActivities, ...$prescActivities])
            ->sortByDesc('raw_at')
            ->values()
            ->take(20)
            ->map(fn ($a) => [
                'id'       => $a['id'],
                'icon'     => $a['icon'],
                'color'    => $a['color'],
                'bg'       => $a['bg'],
                'title'    => $a['title'],
                'name'     => $a['name'],
                'time'     => $a['time'],
                'location' => $a['location'],
            ]);

        return response()->json([
            'stats'    => [
                'patients_accessed' => $patientsAccessed,
                'recent_scans'      => $recentScans,
                'prescriptions'     => $prescriptionsCount,
            ],
            'activity' => $activities,
        ]);
    }

    // ─── Settings: Get Profile ───────────────────────────────────────
    public function getSettingsProfile(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can access this endpoint.'], 403);
        }

        $doctorProfile = $doctor->doctorProfile;

        return response()->json([
            'id' => $doctor->id,
            'name' => $doctor->name,
            'email' => $doctor->email,
            'phone' => $doctor->phone,
            'avatar' => $doctor->avatar,
            'specialization' => $doctorProfile?->specialization,
            'license_number' => $doctorProfile?->license_number,
            'hospital_name' => $doctorProfile?->hospital_name,
            'years_of_experience' => $doctorProfile?->years_of_experience,
            'about' => $doctorProfile?->about,
        ]);
    }

    // ─── Settings: Update Profile ────────────────────────────────────
    public function updateSettingsProfile(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can update this profile.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $doctor->id,
            'phone' => 'sometimes|string|max:20',
            'specialization' => 'sometimes|string|max:255',
            'license_number' => 'sometimes|string|max:100',
            'hospital_name' => 'sometimes|string|max:255',
            'years_of_experience' => 'sometimes|integer|min:0|max:100',
            'about' => 'sometimes|string|max:2000',
        ]);

        // Update user table
        $userData = array_intersect_key($validated, array_flip(['name', 'email', 'phone']));
        if (!empty($userData)) {
            $doctor->update($userData);
        }

        // Update doctor profile
        $profileData = array_intersect_key($validated, array_flip(['specialization', 'license_number', 'hospital_name', 'years_of_experience', 'about']));
        if (!empty($profileData)) {
            $doctor->doctorProfile()->updateOrCreate(
                ['user_id' => $doctor->id],
                $profileData
            );
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'doctor' => $this->getSettingsProfile($request)->original
        ]);
    }

    // ─── Settings: Get Security Info ─────────────────────────────────
    public function getSettingsSecurity(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can access this endpoint.'], 403);
        }

        return response()->json([
            'password_last_changed' => $doctor->password_changed_at ?? $doctor->created_at,
            'two_factor_enabled' => false, // Placeholder for future 2FA
            'last_login' => $doctor->last_login_at,
            'last_login_ip' => $doctor->last_login_ip,
        ]);
    }

    // ─── Settings: Update Password ────────────────────────────────────
    public function updateSettingsPassword(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can change password.'], 403);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!\Hash::check($validated['current_password'], $doctor->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 401);
        }

        $doctor->update([
            'password' => bcrypt($validated['new_password']),
            'password_changed_at' => now(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    // ─── Settings: Get Preferences ────────────────────────────────────
    public function getSettingsPreferences(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can access this endpoint.'], 403);
        }

        // Get or create preferences
        $preferences = $doctor->preferences ?? [
            'email_notifications' => true,
            'push_notifications' => true,
            'sms_notifications' => false,
            'dark_mode' => false,
            'two_factor_enabled' => false,
        ];

        return response()->json($preferences);
    }

    // ─── Settings: Update Preferences ─────────────────────────────────
    public function updateSettingsPreferences(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can update preferences.'], 403);
        }

        $validated = $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'dark_mode' => 'sometimes|boolean',
            'two_factor_enabled' => 'sometimes|boolean',
        ]);

        // Store preferences in a JSON column or separate table
        // For now, we'll use a simple approach with the users table
        $doctor->update([
            'preferences' => array_merge($doctor->preferences ?? [], $validated)
        ]);

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $doctor->preferences
        ]);
    }

    // ─── Settings: Deactivate Account ───────────────────────────────────
    public function deactivateAccount(Request $request)
    {
        $doctor = $request->user();
        
        if (!$doctor->isDoctor()) {
            return response()->json(['message' => 'Only doctors can deactivate account.'], 403);
        }

        // Soft delete - mark as inactive
        $doctor->update([
            'status' => 'inactive',
            'deactivated_at' => now(),
        ]);

        // Revoke all tokens
        $doctor->tokens()->delete();

        return response()->json([
            'message' => 'Account deactivated successfully. You have been logged out.'
        ]);
    }

    // ─── Get Patient's Prescriptions ───────────────────────────
    public function getPatientPrescriptions()
    {
        $patientId = Auth::id();

        $prescriptions = \App\Models\Prescription::where('patient_id', $patientId)
            ->with(['doctor:id,name'])
            ->latest()
            ->get()
            ->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'doctor_name' => $prescription->doctor->name ?? 'Unknown Doctor',
                    'prescription_date' => $prescription->prescription_date,
                    'notes' => $prescription->notes,
                    'status' => $prescription->status ?? 'active',
                    'medications' => $prescription->medications ?? [],
                ];
            });

        return response()->json($prescriptions);
    }
}

