import { Form } from '../components/create/Form'

const Create = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Publicar una residencia</h1>
                    <p className="mt-2 text-sm text-slate-500">Este módulo te permite publicar una residencia</p>
                    <hr className="mt-4 border-slate-200" />
                </header>

                <main className="mt-8">
                    <div className="w-full">
                        <Form />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Create