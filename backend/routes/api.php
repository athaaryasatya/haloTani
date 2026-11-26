<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminLaporanController;
use App\Http\Controllers\Api\Admin\AdminPetaniController;
use App\Http\Controllers\Api\Admin\AdminPromptController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KeluhanController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register',        [AuthController::class, 'register']);
    Route::post('login',           [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password',  [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    Route::put('profil', [ProfileController::class, 'update']);

    Route::get('dashboard', [DashboardController::class, 'index']);

    Route::get('keluhan',      [KeluhanController::class, 'index']);
    Route::post('keluhan',     [KeluhanController::class, 'store']);
    Route::get('keluhan/{id}', [KeluhanController::class, 'show']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('dashboard',          [AdminDashboardController::class, 'index']);
        Route::delete('keluhan/{id}',    [AdminDashboardController::class, 'destroyKeluhan']);

        Route::get('pengguna',           [AdminPetaniController::class, 'index']);
        Route::delete('pengguna/{id}',   [AdminPetaniController::class, 'destroy']);

        Route::get('template-prompt',      [AdminPromptController::class, 'show']);
        Route::put('template-prompt',      [AdminPromptController::class, 'update']);
        Route::post('template-prompt/test', [AdminPromptController::class, 'test']);

        Route::get('laporan',            [AdminLaporanController::class, 'index']);
        Route::post('laporan',           [AdminLaporanController::class, 'store']);
        Route::delete('laporan/{id}',    [AdminLaporanController::class, 'destroy']);
    });
});
