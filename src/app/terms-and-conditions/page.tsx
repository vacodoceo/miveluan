import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Términos y Condiciones</h1>

      <h2 className="text-2xl font-semibold mb-2">
        1. Aceptación de los Términos
      </h2>
      <p className="mb-4">
        Bienvenido a nuestra plataforma. Si continúa navegando y utilizando esta
        plataforma, usted acepta cumplir y estar sujeto a los siguientes
        términos y condiciones de uso, que junto con nuestra política de
        privacidad rigen la relación de Vita con usted en relación con esta
        plataforma. Si no está de acuerdo con alguna parte de estos términos y
        condiciones, por favor no utilice nuestra plataforma.
      </p>

      <h2 className="text-2xl font-semibold mb-2">
        2. Descripción del Servicio
      </h2>
      <p className="mb-4">
        La plataforma permite a los usuarios almacenar, gestionar y compartir
        sus registros médicos de manera segura. La información se almacena en la
        cuenta de Google Drive del usuario, y la plataforma proporciona
        herramientas para la interpretación de documentos médicos mediante
        inteligencia artificial.
      </p>

      <h2 className="text-2xl font-semibold mb-2">3. Sesión de Usuario </h2>
      <p className="mb-4">
        Para utilizar ciertas funciones de la plataforma, es posible que debas
        conectar tu cuenta con Google.
      </p>

      <h2 className="text-2xl font-semibold mb-2">4. Seguridad y Privacidad</h2>
      <p className="mb-4">
        La seguridad de tu información médica es una prioridad. La plataforma no
        almacena datos en nuestros servidores, y todos los documentos se
        almacenan en tu Google Drive. Debes mantener la confidencialidad de tus
        credenciales de acceso.
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Uso Permitido</h2>
      <p className="mb-4">
        Te comprometes a usar la plataforma únicamente para fines legales y de
        acuerdo con todas las leyes aplicables. No debes usar la plataforma
        para: Compartir información falsa o engañosa. Realizar actividades
        fraudulentas o ilegales. Interferir con el funcionamiento de la
        plataforma o comprometer su seguridad.
      </p>

      <h2 className="text-2xl font-semibold mb-2">
        6. Limitación de Responsabilidad
      </h2>
      <p className="mb-4">
        En la medida permitida por la ley, [Nombre de la Empresa/Desarrollador]
        no será responsable por daños directos, indirectos, incidentales,
        especiales o consecuentes que resulten del uso o la incapacidad de uso
        de la Plataforma.
      </p>

      <h2 className="text-2xl font-semibold mb-2">
        7. Modificaciones a los Términos
      </h2>
      <p className="mb-4">
        Nos reservamos el derecho a modificar estos Términos y Condiciones en
        cualquier momento. Cualquier cambio será efectivo al publicarse en la
        plataforma. Se recomienda revisar estos términos periódicamente.
      </p>

      <h2 className="text-2xl font-semibold mb-2">8. Legislación Aplicable </h2>
      <p className="mb-4">
        Estos Términos y Condiciones se regirán e interpretarán de acuerdo con
        las leyes de Chile. Cualquier disputa que surja en relación con estos
        términos estará sujeta a la jurisdicción exclusiva de los tribunales de
        Santiago, Chile.
      </p>

      <Link href="/" className="text-primary underline">
        Volver a la página principal
      </Link>
    </div>
  );
}
