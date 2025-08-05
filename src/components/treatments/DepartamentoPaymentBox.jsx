import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import ModalPayment from "./ModalPayment"; // Asegúrate de que esté adaptado para departamentos
import storeDepartamento from "../../context/store/storeRent";


const stripePromise = loadStripe(import.meta.env.VITE_STRAPI_KEY);

const DepartamentoPaymentBox = ({ departamento }) => {
    const [showModal, setShowModal] = useState(false);
    const { payDepartamento } = storeDepartamento();

    const handlePaymentClick = () => {
        setShowModal(true);
    };

    return (
        <div className="bg-white shadow-md rounded-md p-6 mt-6 text-center">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Aparta tu departamento
        </h2>
        <p className="text-gray-600 mb-4">
            Paga el primer mes de renta para reservar el departamento.
        </p>
        <p className="text-lg font-bold text-green-700 mb-4">
            $ {departamento.precioMensual}
        </p>
        <button
            onClick={handlePaymentClick}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
        >
            Pagar y Apartar
        </button>

        {showModal && (
            <Elements stripe={stripePromise}>
            <ModalPayment
                departamento={departamento}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                setShowModal(false);
                payDepartamento({
                    departamentoId: departamento._id,
                    monto: departamento.precioMensual,
                    metodoPago: "Stripe",
                });
                }}
            />
            </Elements>
        )}
        </div>
    );
    };

export default DepartamentoPaymentBox;
