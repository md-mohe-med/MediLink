<?php

namespace App\Http\Controllers;

use App\Models\LabUpload;
use App\Models\PatientDocument;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    // ─── Get / Initialize Patient Profile ─────────────────────────
    public function profile(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can access this endpoint.',
            ], 403);
        }

        $profile = $user->patientProfile;

        if (!$profile) {
            $profile = PatientProfile::create([
                'user_id'    => $user->id,
                'patient_id' => $this->generatePatientId(),
            ]);
        }

        return response()->json([
            'user'    => $user,
            'profile' => $profile,
        ]);
    }

    // ─── Update Patient Profile ───────────────────────────────────
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can update this profile.',
            ], 403);
        }

        $validated = $request->validate([
            'date_of_birth'      => 'nullable|date',
            'gender'             => 'nullable|string|max:20',
            'national_id'        => 'nullable|string|max:50',
            'address'            => 'nullable|string|max:255',
            'blood_type'         => 'nullable|string|max:10',
            'height'             => 'nullable|numeric',
            'weight'             => 'nullable|numeric',
            'chronic_diseases'   => 'nullable|string',
            'allergies'          => 'nullable|string',
            'current_medications'=> 'nullable|string',
            'smoking_status'     => 'nullable|string|max:50',
            'notes'              => 'nullable|string',
        ]);

        $profile = $user->patientProfile;

        if (!$profile) {
            $profile = new PatientProfile([
                'user_id'    => $user->id,
                'patient_id' => $this->generatePatientId(),
            ]);
        }

        $profile->fill($validated);
        $profile->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => $profile,
        ]);
    }

    // ─── Patient Documents (own uploads + lab uploads) ────────────
    public function documents(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can access their documents.',
            ], 403);
        }

        $patientId = $user->id;

        $ownDocuments = PatientDocument::where('patient_id', $patientId)
            ->orderByDesc('document_date')
            ->get();

        $labUploads = LabUpload::where('patient_id', $patientId)
            ->orderByDesc('test_date')
            ->get();

        return response()->json([
            'patient_documents' => $ownDocuments,
            'lab_uploads'       => $labUploads,
        ]);
    }

    public function storeDocument(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can upload their own documents.',
            ], 403);
        }

        $validated = $request->validate([
            'document_type' => 'required|string|max:50',
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string',
            'document_date' => 'nullable|date',
            'file'          => 'required|file|mimes:pdf,jpg,jpeg,png|max:20480', // 20MB
        ]);

        $file = $validated['file'];
        $path = $file->store('documents', 'public');

        $document = PatientDocument::create([
            'patient_id'    => $user->id,
            'uploaded_by'   => $user->id,
            'document_type' => $validated['document_type'],
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'file_path'     => $path,
            'document_date' => $validated['document_date'] ?? now(),
        ]);

        return response()->json([
            'message'  => 'Document uploaded successfully.',
            'document' => $document,
        ], 201);
    }

    public function destroyDocument(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can delete their own documents.',
            ], 403);
        }

        $document = PatientDocument::findOrFail($id);

        if ((int) $document->patient_id !== (int) $user->id) {
            return response()->json([
                'message' => 'You are not allowed to delete this document.',
            ], 403);
        }

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'message' => 'Document deleted successfully.',
        ]);
    }

    // ─── Patient Prescriptions ────────────────────────────────────
    public function prescriptions(Request $request)
    {
        $user = $request->user();

        if (!$user->isPatient()) {
            return response()->json([
                'message' => 'Only patients can access their prescriptions.',
            ], 403);
        }

        $prescriptions = $user->prescriptions()
            ->with('doctor')
            ->orderByDesc('prescription_date')
            ->get()
            ->map(function ($p) {
                return [
                    'id'               => $p->id,
                    'doctor_name'      => optional($p->doctor)->name,
                    'medications'      => $p->medications,
                    'notes'            => $p->notes,
                    'prescription_date'=> $p->prescription_date,
                ];
            });

        return response()->json([
            'prescriptions' => $prescriptions,
        ]);
    }

    // ─── Verify Patient by Public Medical ID (for Labs) ──────────
    public function verifyByMedicalId(Request $request)
    {
        $user = $request->user();

        if (!$user->isLab()) {
            return response()->json([
                'message' => 'Only labs can verify patients by Medical ID.',
            ], 403);
        }

        $request->validate([
            'patient_id' => 'required|string',
        ]);

        $profile = PatientProfile::where('patient_id', $request->patient_id)->first();

        if (!$profile) {
            return response()->json([
                'message' => 'Patient not found.',
            ], 404);
        }

        $patientUser = $profile->user;

        return response()->json([
            'first_name'  => Str::of($patientUser->name)->before(' ')->value(),
            'patient_id'  => $profile->patient_id,
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────
    protected function generatePatientId(): string
    {
        $year = now()->year;

        do {
            $suffix = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $candidate = "MED-{$year}-{$suffix}";
        } while (PatientProfile::where('patient_id', $candidate)->exists());

        return $candidate;
    }
}

