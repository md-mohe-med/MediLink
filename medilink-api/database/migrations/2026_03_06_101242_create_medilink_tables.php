<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone', 20)->nullable();
            $table->enum('role', ['patient', 'doctor', 'lab', 'admin']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('patient_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('patient_id', 20)->unique();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('national_id', 50)->nullable();
            $table->string('profile_picture')->nullable();
            $table->text('address')->nullable();
            $table->enum('blood_type', ['A+','A-','B+','B-','O+','O-','AB+','AB-'])->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->text('chronic_diseases')->nullable();
            $table->text('allergies')->nullable();
            $table->text('current_medications')->nullable();
            $table->enum('smoking_status', ['never', 'former', 'current'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('profile_picture')->nullable();
            $table->string('specialization')->nullable();
            $table->string('license_number', 100)->nullable();
            $table->string('license_file')->nullable();
            $table->string('hospital_name')->nullable();
            $table->integer('years_of_experience')->nullable();
            $table->text('about')->nullable();
            $table->timestamps();
        });

        Schema::create('lab_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('lab_name')->nullable();
            $table->text('address')->nullable();
            $table->string('working_hours')->nullable();
            $table->string('logo')->nullable();
            $table->string('official_doc')->nullable();
            $table->text('about')->nullable();
            $table->timestamps();
        });

        Schema::create('patient_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('document_type', ['analysis','xray','mri','scanner','report','surgery_report','other']);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->date('document_date')->nullable();
            $table->timestamps();
        });

        Schema::create('lab_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->enum('document_type', ['blood_analysis','urine_analysis','xray','mri','scanner','other']);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->date('test_date')->nullable();
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->json('medications');
            $table->text('notes')->nullable();
            $table->date('prescription_date')->nullable();
            $table->timestamps();
        });

        Schema::create('qr_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->foreignId('used_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('used_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_tokens');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('lab_uploads');
        Schema::dropIfExists('patient_documents');
        Schema::dropIfExists('lab_profiles');
        Schema::dropIfExists('doctor_profiles');
        Schema::dropIfExists('patient_profiles');
        Schema::dropIfExists('users');
    }
};