import Table from "../components/list/Table";

const List = () => {
    return (
        <div className="min-h-full bg-slate-50 py-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <div className="w-full flex flex-col px-2 md:px-4">
            <header className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Residencias</h1>
            <p className="mt-2 text-sm text-slate-500">Este módulo te permite gestionar residencias</p>
            <hr className="mt-4 border-slate-200" />
            </header>

            <main>
            <Table />
            </main>
        </div>
        </div>
    );
};

export default List;