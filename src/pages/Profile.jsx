import CardPassword from '../components/profile/CardPassword'
import { CardProfile } from '../components/profile/CardProfile'
import FormProfile from '../components/profile/FormProfile'

const Profile = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Perfil</h1>
                    <p className="mt-2 text-sm text-slate-500">Este módulo te permite gestionar el perfil del usuario</p>
                    <hr className="mt-6 border-slate-200" />
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <section className="w-full h-full">
                        <FormProfile />
                    </section>

                    <aside className="w-full h-full flex flex-col gap-6">
                        <CardProfile />
                        <CardPassword />
                    </aside>
                </main>
            </div>
        </div>
    )
}

export default Profile