<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // ─── Get Patient's Conversations (Doctors they've visited) ─────────────────
    public function getPatientConversations()
    {
        $patientId = Auth::id();

        $conversations = Conversation::with(['doctor', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->where('patient_id', $patientId)
            ->withCount(['messages as unread_count' => function ($query) use ($patientId) {
                $query->where('sender_id', '!=', $patientId)
                      ->where('is_read', false);
            }])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($conversation) {
                $doctor = $conversation->doctor;
                $lastMessage = $conversation->messages->first();
                
                return [
                    'id' => $conversation->id,
                    'name' => 'Dr. ' . $doctor->name,
                    'preview' => $lastMessage ? substr($lastMessage->content, 0, 50) . '...' : 'No messages yet',
                    'time' => $lastMessage ? $lastMessage->created_at->diffForHumans() : $conversation->created_at->diffForHumans(),
                    'active' => false,
                    'online' => false,
                    'statusColor' => '#22c55e',
                    'avatar' => $doctor->avatar ?? null,
                    'unread_count' => $conversation->unread_count,
                    'specialization' => $doctor->doctorProfile->specialization ?? 'Doctor',
                ];
            });

        return response()->json($conversations);
    }

    // ─── Doctor: Get Messages ───────────────────────────────────────────────
    public function doctorGetMessages($conversationId)
    {
        $doctorId = Auth::id();

        $conversation = Conversation::where('id', $conversationId)
            ->where('doctor_id', $doctorId)
            ->firstOrFail();

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($doctorId) {
                return [
                    'id' => $message->id,
                    'from' => $message->sender_id === $doctorId ? 'me' : 'them',
                    'text' => $message->type === 'text' ? $message->content : null,
                    'type' => $message->type,
                    'fileName' => $message->file_name,
                    'fileSize' => $message->file_size,
                    'time' => $message->created_at->format('h:i A'),
                    'is_read' => $message->is_read,
                    'sender_name' => $message->sender->name,
                ];
            });

        // Mark unread messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $doctorId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $patient = $conversation->patient;
        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'avatar' => $patient->avatar ?? null,
                    'online' => false,
                ],
            ],
            'messages' => $messages,
        ]);
    }

    // ─── Get Messages for a Conversation ───────────────────────────────────────
    public function getMessages($conversationId)
    {
        $patientId = Auth::id();

        $conversation = Conversation::where('id', $conversationId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($patientId) {
                return [
                    'id' => $message->id,
                    'from' => $message->sender_id === $patientId ? 'me' : 'them',
                    'text' => $message->type === 'text' ? $message->content : null,
                    'type' => $message->type,
                    'fileName' => $message->file_name,
                    'fileSize' => $message->file_size,
                    'time' => $message->created_at->format('h:i A'),
                    'is_read' => $message->is_read,
                    'sender_name' => $message->sender->name,
                ];
            });

        // Mark unread messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $patientId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'doctor' => [
                    'id' => $conversation->doctor->id,
                    'name' => 'Dr. ' . $conversation->doctor->name,
                    'specialization' => $conversation->doctor->doctorProfile->specialization ?? 'Doctor',
                    'avatar' => $conversation->doctor->avatar ?? null,
                    'online' => false,
                ],
            ],
            'messages' => $messages,
        ]);
    }

    // ─── Send Message ──────────────────────────────────────────────────────────
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'type' => 'nullable|in:text,file,image',
        ]);

        $patientId = Auth::id();

        $conversation = Conversation::where('id', $conversationId)
            ->where('patient_id', $patientId)
            ->firstOrFail();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $patientId,
            'content' => $request->content,
            'type' => $request->type ?? 'text',
            'is_read' => false,
        ]);

        // Update conversation last message time
        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'message' => [
                'id' => $message->id,
                'from' => 'me',
                'text' => $message->content,
                'type' => $message->type,
                'time' => $message->created_at->format('h:i A'),
            ],
        ]);
    }

    // ─── Create Conversation (when patient visits a doctor) ─────────────────────
    public function createConversation(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
        ]);

        $patientId = Auth::id();
        $doctorId = $request->doctor_id;

        // Check if patient has a completed appointment with this doctor
        $hasVisit = Appointment::where('patient_id', $patientId)
            ->where('doctor_id', $doctorId)
            ->where('status', 'completed')
            ->exists();

        if (!$hasVisit && $request->appointment_id) {
            $appointment = Appointment::find($request->appointment_id);
            if (!$appointment || $appointment->status !== 'completed') {
                return response()->json([
                    'message' => 'You can only chat with doctors you have visited.'
                ], 403);
            }
        }

        // Check if conversation already exists
        $existing = Conversation::where('patient_id', $patientId)
            ->where('doctor_id', $doctorId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Conversation already exists',
                'conversation' => $existing
            ]);
        }

        $conversation = Conversation::create([
            'patient_id' => $patientId,
            'doctor_id' => $doctorId,
            'appointment_id' => $request->appointment_id,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Conversation created successfully',
            'conversation' => $conversation
        ], 201);
    }

    // ─── Doctor: Get Their Conversations ────────────────────────────────────────
    public function getDoctorConversations()
    {
        $doctorId = Auth::id();

        $conversations = Conversation::with(['patient', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->where('doctor_id', $doctorId)
            ->withCount(['messages as unread_count' => function ($query) use ($doctorId) {
                $query->where('sender_id', '!=', $doctorId)
                      ->where('is_read', false);
            }])
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($conversation) {
                $patient = $conversation->patient;
                $lastMessage = $conversation->messages->first();
                
                return [
                    'id' => $conversation->id,
                    'patient_id' => $patient->id,
                    'name' => $patient->name,
                    'preview' => $lastMessage ? substr($lastMessage->content, 0, 50) . '...' : 'No messages yet',
                    'time' => $lastMessage ? $lastMessage->created_at->diffForHumans() : $conversation->created_at->diffForHumans(),
                    'active' => false,
                    'online' => false,
                    'avatar' => $patient->avatar ?? null,
                    'unread_count' => $conversation->unread_count,
                    'patient_id_display' => $patient->patientProfile->patient_id ?? null,
                ];
            });

        return response()->json($conversations);
    }

    // ─── Doctor: Send Message ───────────────────────────────────────────────────
    public function doctorSendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'type' => 'nullable|in:text,file,image',
        ]);

        $doctorId = Auth::id();

        $conversation = Conversation::where('id', $conversationId)
            ->where('doctor_id', $doctorId)
            ->firstOrFail();

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $doctorId,
            'content' => $request->content,
            'type' => $request->type ?? 'text',
            'is_read' => false,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'message' => [
                'id' => $message->id,
                'from' => 'me',
                'text' => $message->content,
                'type' => $message->type,
                'time' => $message->created_at->format('h:i A'),
            ],
        ]);
    }

    // ─── Doctor: Create Conversation with Patient ─────────────────────────────
    public function doctorCreateConversation(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
        ]);

        $doctorId = Auth::id();
        $patientId = $request->patient_id;

        // Check if patient exists and is actually a patient
        $patient = User::find($patientId);
        if (!$patient || $patient->role !== 'patient') {
            return response()->json(['message' => 'Invalid patient.'], 400);
        }

        // Check if conversation already exists
        $existingConversation = Conversation::where('doctor_id', $doctorId)
            ->where('patient_id', $patientId)
            ->first();

        if ($existingConversation) {
            return response()->json([
                'message' => 'Conversation already exists',
                'conversation' => [
                    'id' => $existingConversation->id,
                    'patient_id' => $existingConversation->patient_id,
                    'patient_name' => $patient->name,
                    'doctor_id' => $existingConversation->doctor_id,
                    'created_at' => $existingConversation->created_at,
                ]
            ]);
        }

        // Create new conversation
        $conversation = Conversation::create([
            'doctor_id' => $doctorId,
            'patient_id' => $patientId,
            'last_message_at' => now(),
        ]);

        return response()->json([
            'message' => 'Conversation created successfully',
            'conversation' => [
                'id' => $conversation->id,
                'patient_id' => $conversation->patient_id,
                'patient_name' => $patient->name,
                'doctor_id' => $conversation->doctor_id,
                'created_at' => $conversation->created_at,
            ]
        ], 201);
    }
}
