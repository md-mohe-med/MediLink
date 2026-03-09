<?php

namespace App\Http\Controllers;

use App\Models\LabUpload;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class LabController extends Controller
{
    // ─── Get Lab Dashboard Stats ───────────────────────────────
    public function dashboard()
    {
        $labId = Auth::id();
        $today = now()->startOfDay();

        $uploadsToday = LabUpload::where('lab_id', $labId)
            ->whereDate('created_at', $today)
            ->count();

        $totalProcessed = LabUpload::where('lab_id', $labId)->count();

        $recentUploads = LabUpload::where('lab_id', $labId)
            ->with('patient:id,name')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($upload) {
                return [
                    'id' => $upload->id,
                    'patient_name' => $upload->patient->name ?? 'Unknown',
                    'test_type' => $upload->document_type,
                    'status' => 'Complete',
                    'time' => $upload->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'uploads_today' => $uploadsToday,
            'total_processed' => $totalProcessed,
            'pending_approvals' => 0,
            'active_equipment' => 12,
            'staff_online' => 3,
            'recent_uploads' => $recentUploads,
        ]);
    }

    // ─── Get Lab Uploads List ─────────────────────────────────
    public function getUploads(Request $request)
    {
        $labId = Auth::id();
        
        $uploads = LabUpload::where('lab_id', $labId)
            ->with('patient:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($uploads);
    }

    // ─── Verify Patient by Medical ID ─────────────────────────
    public function verifyPatient(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|string',
        ]);

        $profile = PatientProfile::where('patient_id', $request->patient_id)->first();

        if (!$profile) {
            return response()->json([
                'found' => false,
                'message' => 'Patient not found for the given Medical ID.',
            ], 404);
        }

        $user = User::find($profile->user_id);

        return response()->json([
            'found' => true,
            'patient' => [
                'id' => $profile->patient_id,
                'user_id' => $user->id,
                'name' => $user->name,
                'dob' => $profile->date_of_birth ?? 'N/A',
                'initials' => $this->getInitials($user->name),
            ],
        ]);
    }

    private function getInitials($name)
    {
        $parts = explode(' ', $name);
        $initials = '';
        foreach ($parts as $part) {
            $initials .= strtoupper(substr($part, 0, 1));
        }
        return substr($initials, 0, 2);
    }

    // ─── Upload Result File to Patient Account ───────────────────
    public function upload(Request $request)
    {
        $user = $request->user();

        if (!$user->isLab()) {
            return response()->json([
                'message' => 'Only labs can upload results.',
            ], 403);
        }

        $validated = $request->validate([
            // Public Medical ID, e.g. MED-YYYY-XXXXX
            'patient_id'    => 'required|string',
            'document_type' => 'required|string|max:50',
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'test_date'     => 'nullable|date',
            'file'          => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480', // 20MB
        ]);

        $profile = PatientProfile::where('patient_id', $validated['patient_id'])->first();

        if (!$profile) {
            return response()->json([
                'message' => 'Patient not found for the given Medical ID.',
            ], 404);
        }

        $file = $validated['file'];
        $path = $file->store('lab_uploads', 'public');

        $upload = LabUpload::create([
            'lab_id'        => $user->id,
            'patient_id'    => $profile->user_id,
            'document_type' => $validated['document_type'],
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'file_path'     => $path,
            'test_date'     => $validated['test_date'] ?? now(),
        ]);

        return response()->json([
            'message' => 'Lab result uploaded successfully.',
            'upload'  => $upload,
        ], 201);
    }

    // ─── Get Patient's Lab Results ─────────────────────────────
    public function getPatientLabResults()
    {
        $patientId = Auth::id();

        $uploads = LabUpload::where('patient_id', $patientId)
            ->with('lab:id,name')
            ->latest()
            ->get()
            ->map(function ($upload) {
                return [
                    'id' => $upload->id,
                    'test_type' => $upload->document_type,
                    'title' => $upload->title,
                    'description' => $upload->description,
                    'lab_name' => $upload->lab->name ?? 'Unknown Lab',
                    'file_path' => $upload->file_path,
                    'test_date' => $upload->test_date,
                    'uploaded_at' => $upload->created_at->diffForHumans(),
                ];
            });

        return response()->json($uploads);
    }

    // ─── View Lab Result File (Patient) ────────────────────────
    public function viewLabResultFile($id)
    {
        $patientId = Auth::id();

        $upload = LabUpload::where('id', $id)
            ->where('patient_id', $patientId)
            ->first();

        if (!$upload) {
            return response()->json(['message' => 'File not found or access denied.'], 404);
        }

        $path = storage_path('app/public/' . $upload->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        return response()->file($path);
    }

    // ─── Get Patient's Lab Results for Doctor ──────────────────
    public function getPatientLabResultsForDoctor($patientId)
    {
        $doctorId = Auth::id();

        // Verify the doctor has a conversation with this patient
        $hasConversation = \App\Models\Conversation::where('doctor_id', $doctorId)
            ->where('patient_id', $patientId)
            ->exists();

        if (!$hasConversation) {
            return response()->json(['message' => 'No conversation found with this patient.'], 403);
        }

        $uploads = LabUpload::where('patient_id', $patientId)
            ->with('lab:id,name')
            ->latest()
            ->get()
            ->map(function ($upload) {
                return [
                    'id' => $upload->id,
                    'test_type' => $upload->document_type,
                    'title' => $upload->title,
                    'description' => $upload->description,
                    'lab_name' => $upload->lab->name ?? 'Unknown Lab',
                    'file_path' => $upload->file_path,
                    'test_date' => $upload->test_date,
                    'uploaded_at' => $upload->created_at->diffForHumans(),
                ];
            });

        return response()->json($uploads);
    }

    // ─── View Lab Result File for Doctor ───────────────────────
    public function viewLabResultFileForDoctor($patientId, $labResultId)
    {
        $doctorId = Auth::id();

        // Verify the doctor has a conversation with this patient
        $hasConversation = \App\Models\Conversation::where('doctor_id', $doctorId)
            ->where('patient_id', $patientId)
            ->exists();

        if (!$hasConversation) {
            return response()->json(['message' => 'No conversation found with this patient.'], 403);
        }

        $upload = LabUpload::where('id', $labResultId)
            ->where('patient_id', $patientId)
            ->first();

        if (!$upload) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $path = storage_path('app/public/' . $upload->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        return response()->file($path);
    }

    // ─── Lab Settings: Get Profile ─────────────────────────────
    public function getSettingsProfile()
    {
        $user = Auth::user();
        
        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'lab_name' => $user->labProfile?->lab_name ?? $user->name,
            'license_number' => $user->labProfile?->license_number ?? null,
            'phone' => $user->labProfile?->phone ?? null,
            'address' => $user->labProfile?->address ?? null,
            'avatar' => $user->avatar,
        ]);
    }

    // ─── Lab Settings: Update Profile ──────────────────────────
    public function updateSettingsProfile(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'lab_name' => 'sometimes|string|max:255',
            'license_number' => 'sometimes|string|max:50',
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string|max:500',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
        ]);

        // Update or create lab profile
        $user->labProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'lab_name' => $validated['lab_name'] ?? $user->name,
                'license_number' => $validated['license_number'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Profile updated successfully',
            'name' => $user->name,
            'email' => $user->email,
            'lab_name' => $validated['lab_name'] ?? $user->labProfile?->lab_name,
            'license_number' => $validated['license_number'] ?? $user->labProfile?->license_number,
        ]);
    }

    // ─── Lab Settings: Get Security ──────────────────────────
    public function getSettingsSecurity()
    {
        $user = Auth::user();
        
        return response()->json([
            'password_last_changed' => $user->password_updated_at,
            'two_factor_enabled' => $user->two_factor_enabled ?? false,
            'last_login' => $user->last_login_at,
            'login_history' => [], // Can be populated from a login_history table
        ]);
    }

    // ─── Lab Settings: Update Password ─────────────────────────
    public function updateSettingsPassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 401);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'password_updated_at' => now(),
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    // ─── Lab Settings: Get Preferences ─────────────────────────
    public function getSettingsPreferences()
    {
        $user = Auth::user();
        
        return response()->json([
            'email_notifications' => $user->preferences?->email_notifications ?? true,
            'push_notifications' => $user->preferences?->push_notifications ?? true,
            'sms_notifications' => $user->preferences?->sms_notifications ?? false,
            'dark_mode' => $user->preferences?->dark_mode ?? false,
            'language' => $user->preferences?->language ?? 'en',
        ]);
    }

    // ─── Lab Settings: Update Preferences ──────────────────────
    public function updateSettingsPreferences(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'email_notifications' => 'sometimes|boolean',
            'push_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'dark_mode' => 'sometimes|boolean',
            'language' => 'sometimes|string|in:en,fr,ar',
        ]);

        $user->preferences()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'message' => 'Preferences updated successfully',
            ...$validated
        ]);
    }

    // ─── Lab Settings: Deactivate Account ─────────────────────
    public function deactivateAccount()
    {
        $user = Auth::user();
        
        // Delete all lab uploads
        LabUpload::where('lab_id', $user->id)->delete();
        
        // Delete lab profile
        $user->labProfile?->delete();
        
        // Delete user
        $user->delete();

        return response()->json(['message' => 'Account deactivated successfully.']);
    }
}

