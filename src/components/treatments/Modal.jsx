import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function ModalPayment({ departamento, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
        setLoading(false);
        return;
        }

        const cardElement = elements.getElement(CardElement);

        try {
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
        });

        if (error) {
            console.error("Error al crear método de pago:", error);
            setLoading(false);
            return;
        }

        // Aquí podrías enviar paymentMethod.id al backend si lo necesitas
        console.log("Método de pago creado:", paymentMethod);

        // Simula éxito
        onSuccess();
        } catch (err) {
        console.error("Error en el pago:", err);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-y-auto p-6 max-w-lg w-full border border-gray-700 relative">
            <p className="text-white font-bold text-xl mb-4">Apartar Departamento</p>

            <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-semibold text-gray-200 text-left">Detalle</label>
                <ul className="text-gray-400 bg-gray-700 p-2 rounded-md text-left">
                <li><strong>Título:</strong> {departamento.titulo}</li>
                <li><strong>Descripción:</strong> {departamento.descripcion}</li>
                <li><strong>Ciudad:</strong> {departamento.ciudad}</li>
                </ul>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-200 text-left">Precio</label>
                <p className="text-green-400 bg-gray-700 p-2 rounded-md font-bold text-left">
                $ {departamento.precioMensual}
                </p>
            </div>

            <label className="block text-sm font-semibold text-gray-200 text-left">Tarjeta de crédito</label>
            <div className="p-3 border border-gray-600 rounded-lg bg-gray-700">
                <CardElement options={{ style: { base: { color: "#fff" } } }} />
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white transition duration-300"
                disabled={loading}
                >
                {loading ? "Procesando....." : "Pagar"}
                </button>

                <button
                type="button"
                className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-800 text-white transition duration-300"
                onClick={onClose}
                >
                Cancelar
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }

export default ModalPayment;
