import { useState, useEffect, useRef } from 'react';

export default function ChatAgente({ webhookUrl, nombreAgente }) {
  // --- ESTADOS ---
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);

  // --- REF PARA EL SCROLL ---
  const finalDelChatRef = useRef(null);

  // --- EFECTO: SCROLL AUTOMÁTICO ---
  useEffect(() => {
    // Cada vez que cambia la lista de mensajes, bajamos el scroll
    finalDelChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // --- LÓGICA DE ENVÍO ---
  const enviar = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Agregar mensaje del usuario
    const nuevoMensajeUsuario = { role: 'user', texto: input };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setCargando(true);
    setInput('');

    try {
      // 2. Enviar a Make
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: nuevoMensajeUsuario.texto })
      });

      // Leemos texto plano (porque así configuramos Make)
      const textoRespuesta = await res.text();

      // 3. Agregar respuesta del bot
      const nuevoMensajeBot = { role: 'bot', texto: textoRespuesta || "Sin respuesta..." };
      setMensajes((prev) => [...prev, nuevoMensajeBot]);

    } catch (error) {
      setMensajes((prev) => [...prev, { role: 'bot', texto: "Error de conexión ❌" }]);
    }
    setCargando(false);
  };

  // --- INTERFAZ VISUAL (JSX) ---
  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
      
      {/* Encabezado */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">Chat con: <span className="text-purple-400">{nombreAgente}</span></h3>
        <a href="/" className="text-sm text-gray-400 hover:text-white">⬅ Volver al menú</a>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Saluda al agente para comenzar...</p>
        )}
        
        {mensajes.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-gray-200 rounded-bl-none'
            }`}>
              {msg.texto}
            </div>
          </div>
        ))}
        
        {cargando && <div className="text-gray-500 text-sm animate-pulse ml-2">Escribiendo...</div>}
        
        {/* ELEMENTO INVISIBLE PARA EL SCROLL */}
        <div ref={finalDelChatRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviar} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-slate-900 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          disabled={cargando}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
