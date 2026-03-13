import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function DashboardRegisterPage() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <RegisterForm />
        </Suspense>
    );
}