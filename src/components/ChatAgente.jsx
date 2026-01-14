import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // <--- 1. IMPORTANTE: Importar esto

export default function ChatAgente({ webhookUrl, nombreAgente }) {
  // --- ESTADOS ---
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);

  // --- REF PARA EL SCROLL ---
  const finalDelChatRef = useRef(null);

  // --- EFECTO: SCROLL AUTOMÁTICO ---
  useEffect(() => {
    finalDelChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // --- LÓGICA DE ENVÍO ---
  const enviar = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const nuevoMensajeUsuario = { role: 'user', texto: input };
    const mensajesParaHistorial = [...mensajes, nuevoMensajeUsuario];

    // Memoria de últimos 6 mensajes
    const historiaTexto = mensajesParaHistorial.slice(-6)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.texto}`)
      .join('\n');

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setCargando(true);
    setInput('');

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: nuevoMensajeUsuario.texto,
          historia: historiaTexto
        })
      });

      const textoRespuesta = await res.text();
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
        <h3 className="text-white font-bold text-lg">Chat con: <span className="text-teal-400">{nombreAgente}</span></h3>
        <a href="/" className="text-sm text-gray-400 hover:text-white">⬅ Volver al menú</a>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.length === 0 && (
          <p className="text-center text-gray-500 mt-10">Saluda al agente para comenzar...</p>
        )}

        {mensajes.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user'
              ? 'bg-cyan-600 text-white rounded-br-none'
              : 'bg-slate-700 text-gray-200 rounded-bl-none'
              }`}>

              {/* --- AQUÍ ESTÁ EL CAMBIO MÁGICO --- */}
              <ReactMarkdown
                components={{
                  // Estilizar enlaces para que se vean y funcionen
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-100 underline font-bold break-all"
                    />
                  ),
                  // Estilizar párrafos
                  p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                  // Estilizar listas
                  ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
                  ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
                  li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                  // Estilizar negritas
                  strong: ({ node, ...props }) => <strong {...props} className="font-bold text-white" />
                }}
              >
                {msg.texto}
              </ReactMarkdown>

            </div>
          </div>
        ))}

        {cargando && <div className="text-gray-500 text-sm animate-pulse ml-2">Escribiendo...</div>}
        <div ref={finalDelChatRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviar} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 bg-slate-900 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          disabled={cargando}
          className="bg-cyan-600 hover:bg-teal-400 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
