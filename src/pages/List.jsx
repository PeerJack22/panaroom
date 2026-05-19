import Table from "../components/list/Table";

const List = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Residencias</h1>
            <p className="mt-2 text-sm text-slate-500">Este módulo te permite gestionar residencias</p>
            <hr className="mt-6 border-slate-200" />
            </header>

            <main>
            <Table />
            </main>
        </div>
        </div>
    );
};

export default List;