<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KeluhanController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

// ---- Publik ----
Route::prefix('auth')->group(function () {
    Route::post('register',        [AuthController::class, 'register']);
    Route::post('login',           [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password',  [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

// ---- Harus login (Bearer token) ----
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    Route::put('profil', [ProfileController::class, 'update']);

    Route::get('dashboard', [DashboardController::class, 'index']);

    Route::get('keluhan',           [KeluhanController::class, 'index']);
    Route::post('keluhan',          [KeluhanController::class, 'store']);
    Route::get('keluhan/{id}', [KeluhanController::class, 'show']);
});
