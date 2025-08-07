import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { io } from 'socket.io-client';

const Chat = () => {
    const [responses, setResponses] = useState([]);
    const [socket, setSocket] = useState(null);
    const [chat, setChat] = useState(true);
    const [nameUser, setNameUser] = useState("");
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const handleEnterChat = (data) => {
        setNameUser(data.name);
        setChat(false);
    };

    const handleMessageChat = (data) => {
        if (!socket) return console.error("No hay conexión con el servidor");

        const storedUser = JSON.parse(localStorage.getItem("auth-token"));
        const rol = storedUser?.state?.rol || "invitado";

        const newMessage = {
            body: data.message,
            name: nameUser,
            rol,
            timestamp: new Date().toISOString()
        };

        socket.emit("enviar-mensaje-front-back", newMessage);
        setResponses((prev) => [...prev, newMessage]);
        reset({ message: "" });
    };

    useEffect(() => {
        const newSocket = io("https://bakend-alquiler.onrender.com", {
            transports: ['polling', 'websocket'],
            secure: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        setSocket(newSocket);

        newSocket.on("enviar-mensaje-front-back", (payload) => {
            setResponses((prev) => [...prev, payload]);
        });

        return () => newSocket.disconnect();
    }, []);

    return (
        <>
            {chat ? (
                <div>
                    <form onSubmit={handleSubmit(handleEnterChat)} className="flex justify-center gap-5 mt-10">
                        <input
                            type="text"
                            placeholder="Ingresa tu nombre de usuario"
                            className="block w-1/2 rounded-md border border-gray-300 focus:border-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-700 py-1 px-2 text-gray-500"
                            {...register("name", { required: "El nombre de usuario es obligatorio" })}
                        />
                        <button className="py-2 w-1/2 block text-center bg-gray-500 text-slate-300 border rounded-xl hover:scale-100 duration-300 hover:bg-gray-900 hover:text-white">
                            Ingresar al chat
                        </button>
                    </form>
                    {errors.name && <p className="text-red-800 text-center mt-2">{errors.name.message}</p>}
                </div>
            ) : (
                <div className="flex flex-col justify-between h-[80vh] max-w-3xl mx-auto mt-10 bg-white rounded shadow p-4">
                    <div className="flex flex-col space-y-4 overflow-y-auto px-2">
                        {responses.map((response, index) => (
                            <div
                                key={index}
                                className={`my-2 p-3 rounded-md text-white max-w-md ${
                                    response.name === nameUser ? 'bg-slate-700 self-start' : 'bg-black self-end'
                                }`}
                            >
                                <div className="text-sm font-semibold text-blue-300">
                                    {response.name}
                                </div>
                                <div className="text-xs text-gray-400 italic mb-1">
                                    {response.rol} • {new Date(response.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="text-sm">{response.body}</div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4">
                        <form onSubmit={handleSubmit(handleMessageChat)}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Escribe tu mensaje!"
                                    className="w-full focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 pl-2 bg-gray-200 rounded-md py-3"
                                    {...register("message", { required: "El mensaje es obligatorio" })}
                                />
                                <button className="px-4 py-3 rounded-lg text-white bg-green-800 hover:bg-green-600 font-bold">
                                    Enviar
                                </button>
                            </div>
                            {errors.message && <p className="text-red-800 mt-2">{errors.message.message}</p>}
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chat;
