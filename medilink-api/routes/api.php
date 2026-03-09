<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\QrController;
use App\Http\Controllers\LabController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\ChatController;

// ─── Public Routes ────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ─── Authenticated Routes ────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Available to any authenticated role
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ─── Patient Routes ──────────────────────────────────────
    Route::middleware('role:patient')->prefix('patient')->group(function () {
        Route::get('/profile', [PatientController::class, 'profile']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);

        Route::get('/documents', [PatientController::class, 'documents']);
        Route::post('/documents', [PatientController::class, 'storeDocument']);
        Route::delete('/documents/{id}', [PatientController::class, 'destroyDocument']);

        Route::get('/prescriptions', [PatientController::class, 'prescriptions']);

        // Labs verify patient by Medical ID (returns only first name)
        Route::get('/verify', [PatientController::class, 'verifyByMedicalId']);
    });

    // ─── QR Routes ───────────────────────────────────────────
    // QR tokens are patient-owned; doctors can also verify them
    Route::middleware('role:patient,doctor')->group(function () {
        Route::post('/qr/generate', [QrController::class, 'generate']);
        Route::post('/qr/verify', [QrController::class, 'verify']);
    });

    // ─── Lab Routes ──────────────────────────────────────────
    Route::middleware('role:lab')->group(function () {
        Route::get('/lab/dashboard', [LabController::class, 'dashboard']);
        Route::get('/lab/uploads', [LabController::class, 'getUploads']);
        Route::post('/lab/upload', [LabController::class, 'upload']);
        Route::get('/lab/verify-patient', [LabController::class, 'verifyPatient']);
        
        // Lab Settings Routes
        Route::get('/lab/settings/profile', [LabController::class, 'getSettingsProfile']);
        Route::put('/lab/settings/profile', [LabController::class, 'updateSettingsProfile']);
        Route::get('/lab/settings/security', [LabController::class, 'getSettingsSecurity']);
        Route::put('/lab/settings/password', [LabController::class, 'updateSettingsPassword']);
        Route::get('/lab/settings/preferences', [LabController::class, 'getSettingsPreferences']);
        Route::put('/lab/settings/preferences', [LabController::class, 'updateSettingsPreferences']);
        Route::post('/lab/settings/deactivate', [LabController::class, 'deactivateAccount']);
    });

    // ─── Doctor Routes ───────────────────────────────────────
    Route::middleware('role:doctor')->group(function () {
        Route::get('/doctor/dashboard', [DoctorController::class, 'dashboard']);
        Route::post('/prescriptions', [DoctorController::class, 'storePrescription']);
        Route::get('/doctor/patient/{id}', [DoctorController::class, 'showPatient']);
        Route::get('/doctor/patient/{id}/lab-results', [LabController::class, 'getPatientLabResultsForDoctor']);
        Route::get('/doctor/patient/{id}/lab-results/{labResultId}/view', [LabController::class, 'viewLabResultFileForDoctor']);
        
        // Doctor Settings Routes
        Route::get('/doctor/settings/profile', [DoctorController::class, 'getSettingsProfile']);
        Route::put('/doctor/settings/profile', [DoctorController::class, 'updateSettingsProfile']);
        Route::get('/doctor/settings/security', [DoctorController::class, 'getSettingsSecurity']);
        Route::put('/doctor/settings/password', [DoctorController::class, 'updateSettingsPassword']);
        Route::get('/doctor/settings/preferences', [DoctorController::class, 'getSettingsPreferences']);
        Route::put('/doctor/settings/preferences', [DoctorController::class, 'updateSettingsPreferences']);
        Route::post('/doctor/settings/deactivate', [DoctorController::class, 'deactivateAccount']);
    });

    // ─── Admin Routes ────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/activity', [AdminController::class, 'activity']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::put('/users/{id}/status', [AdminController::class, 'updateStatus']);
        Route::put('/users/{id}/role', [AdminController::class, 'changeRole']);
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetPassword']);
        Route::post('/users/{id}/force-logout', [AdminController::class, 'forceLogout']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        
        // Admin Settings Routes
        Route::get('/settings/profile', [AdminController::class, 'getProfile']);
        Route::put('/settings/profile', [AdminController::class, 'updateProfile']);
        Route::get('/settings/security', [AdminController::class, 'getSecurity']);
        Route::put('/settings/password', [AdminController::class, 'updatePassword']);
        Route::get('/settings/preferences', [AdminController::class, 'getPreferences']);
        Route::put('/settings/preferences', [AdminController::class, 'updatePreferences']);
        Route::post('/settings/deactivate', [AdminController::class, 'deactivateAccount']);
    });

    // ─── Patient Routes ────────────────────────────────────────────────────
    Route::middleware('role:patient')->prefix('patient')->group(function () {
        // Dashboard data
        Route::get('/profile', [PatientController::class, 'profile']);
        Route::get('/documents', [PatientController::class, 'documents']);
        Route::get('/prescriptions', [PatientController::class, 'prescriptions']);
        
        // Chat
        Route::get('/conversations', [ChatController::class, 'getPatientConversations']);
        Route::get('/conversations/{id}/messages', [ChatController::class, 'getMessages']);
        Route::post('/conversations/{id}/messages', [ChatController::class, 'sendMessage']);
        Route::post('/conversations', [ChatController::class, 'createConversation']);
        
        // Patient Lab Results
        Route::get('/lab-results', [LabController::class, 'getPatientLabResults']);
        Route::get('/lab-results/{id}/view', [LabController::class, 'viewLabResultFile']);
        
        // Patient Prescriptions
        Route::get('/prescriptions', [DoctorController::class, 'getPatientPrescriptions']);
    });

    Route::middleware('role:doctor')->prefix('doctor')->group(function () {
        Route::get('/conversations', [ChatController::class, 'getDoctorConversations']);
        Route::get('/conversations/{id}/messages', [ChatController::class, 'doctorGetMessages']);
        Route::post('/conversations/{id}/messages', [ChatController::class, 'doctorSendMessage']);
        Route::post('/conversations', [ChatController::class, 'doctorCreateConversation']);
    });
});
