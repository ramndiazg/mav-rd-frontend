import ModulosVideo from "@/components/kit-preparacion/ModulosVideo";

const MODULOS = [
  { numero: 1, titulo: "Como obtener permiso o carnet de aprendizaje", youtubeId: "BHbcDoxo5gE" },
  { numero: 2, titulo: "Funcion, mantenimiento y luces del vehiculo", youtubeId: "Jv403ccaECg" },
  { numero: 3, titulo: "Sistemas de seguridad: activa y pasiva", youtubeId: "uInih6eEb6Y" },
  { numero: 4, titulo: "Como controlar el acelerador", youtubeId: "IdHEgFJ0Dfc" },
  { numero: 5, titulo: "Documentos y limites de velocidad al conducir", youtubeId: "HOHtd5nOpMc" },
  { numero: 6, titulo: "Uso del cinturon y consejos para manejar a la defensiva", youtubeId: "hewpYclkhbw" },
  { numero: 7, titulo: "Los frenos ABS y el sistema EPS", youtubeId: "1OPZLo9D808" },
  { numero: 8, titulo: "Seguridad activa al conducir", youtubeId: "-NyKElpAEtA" },
  { numero: 9, titulo: "Seguridad pasiva al conducir", youtubeId: "r_jgy5SOLUQ" },
  { numero: 10, titulo: "Funcion de las gomas o neumaticos", youtubeId: "KDHoVbK5l8o" },
  { numero: 11, titulo: "Como obtener el carnet de aprendizaje para conducir", youtubeId: "ON1qH31T3jQ" },
  { numero: 12, titulo: "Luces del vehiculo y sus funciones", youtubeId: "79x232wH3aE" },
  { numero: 13, titulo: "El sistema electrico de un vehiculo", youtubeId: "uVbQNieyoDQ" },
  { numero: 14, titulo: "Cinturon de seguridad", youtubeId: "7ePwqb_DWtM" },
  { numero: 15, titulo: "Manejo a la defensiva", youtubeId: "iJ57_jBWGnE" },
  { numero: 16, titulo: "Curvas al conducir", youtubeId: "hunWOzRs50M" },
  { numero: 17, titulo: "Situaciones climaticas al conducir", youtubeId: "SkqcpXALmMM" },
  { numero: 18, titulo: "Tips y maniobras para conducir", youtubeId: "_KK0Uw9sNxc" },
  { numero: 19, titulo: "Limites de velocidad al conducir", youtubeId: "oushiyxS2MI" },
  { numero: 20, titulo: "Vias y senales de transito segun ubicacion", youtubeId: "cb_eKHexbwE" },
  { numero: 21, titulo: "Imagenes en el tablero del auto (testigos)", youtubeId: "j62HXRxJ9tM" },
];

export const metadata = {
  title: "Kit de Preparacion INTRANT | Mujeres al Volante RD",
};

export default function KitPreparacionPage() {
  return (
    <main className="bg-neutral-bg">
      <section className="bg-brand-blue text-white px-6 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Kit de Preparacion INTRANT
          </h1>
          <p className="font-body text-brand-blueLight text-lg leading-relaxed">
            Antes de tu clase presencial, mira los modulos en video y practica
            con el simulador oficial. Cuando termines, ya estaras lista para
            aprobar el examen teorico y sacar tu carnet de aprendizaje.
          </p>
        </div>
      </section>

      <div className="road-divider"></div>

      <section className="px-6 py-12 max-w-4xl mx-auto grid gap-4 md:grid-cols-2">
        <a
          href="https://ov.intrant.gob.do/#/login"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-white border-2 border-brand-pink p-6 text-center hover:bg-brand-pinkLight transition-colors"
        >
          <p className="font-display font-semibold text-brand-blue mb-1">
            Simulador de examen INTRANT
          </p>
          <p className="text-sm text-neutral-text">
            Registrate con tu cedula y practica el examen teorico oficial.
          </p>
        </a>

        <a
          href="http://wsgeointrant.intrant.gob.do:82/Turnos/Turnos/Domini3"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-white border-2 border-brand-blue p-6 text-center hover:bg-brand-pinkLight transition-colors"
        >
          <p className="font-display font-semibold text-brand-blue mb-1">
            Agenda tu cita en INTRANT
          </p>
          <p className="text-sm text-neutral-text">
            Saca tu turno para el permiso de aprendizaje.
          </p>
        </a>
      </section>

      <section className="px-6 pb-4 max-w-4xl mx-auto">
        <div className="rounded-xl bg-brand-pinkLight p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-neutral-text">
            <strong className="font-display text-brand-blue">
              Minimanual de vehiculos livianos
            </strong>
            {" "}(categoria 2, MMA 3,500 Kg) - la guia oficial en PDF.
          </p>
          <a
            href="https://mujeresalvolanterd.weebly.com/uploads/1/3/3/0/133017066/minimanual_de_educaci%C3%B3n_vial_para_principiantes%5E.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-brand-pink text-white px-5 py-2 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Descargar PDF
          </a>
        </div>
      </section>

      <section className="px-6 py-12 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-brand-blue mb-2">
          Modulos en video
        </h2>
        <p className="text-sm text-neutral-text mb-6">
          Toca cualquier modulo para reproducirlo. Recomendamos verlos en orden.
        </p>
        <ModulosVideo modulos={MODULOS} />
      </section>
    </main>
  );
}
