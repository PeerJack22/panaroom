import CardPassword from '../components/profile/CardPassword'
import { CardProfile } from '../components/profile/CardProfile'
import FormProfile from '../components/profile/FormProfile'

const Profile = () => {
    return (
        <div className="h-screen overflow-hidden bg-slate-50 py-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="mx-auto flex h-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
                <header className="mb-4 shrink-0">
                    <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Perfil</h1>
                    <p className="mt-1 text-sm text-slate-500">Este módulo te permite gestionar el perfil del usuario</p>
                    <hr className="mt-4 border-slate-200" />
                </header>

                <main className="grid flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                    <section className="w-full">
                        <FormProfile />
                    </section>

                    <aside className="flex w-full flex-col gap-3 xl:content-start">
                        <CardProfile />
                        <CardPassword />
                    </aside>
                </main>
            </div>
        </div>
    )
}

export default Profile