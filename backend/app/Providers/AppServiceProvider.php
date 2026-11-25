<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Email reset password menaut ke halaman di frontend, bukan ke backend.
        ResetPassword::createUrlUsing(function ($petani, string $token) {
            $frontend = rtrim(config('app.frontend_url'), '/');

            return $frontend . '/reset-password?token=' . $token . '&email=' . urlencode($petani->getEmailForPasswordReset());
        });
    }
}
