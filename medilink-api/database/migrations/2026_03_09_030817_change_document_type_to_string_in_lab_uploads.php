<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lab_uploads', function (Blueprint $table) {
            $table->string('document_type', 100)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_uploads', function (Blueprint $table) {
            $table->enum('document_type', ['blood_analysis','urine_analysis','xray','mri','scanner','other'])->change();
        });
    }
};
