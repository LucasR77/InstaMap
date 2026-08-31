export interface SampleDocument {
  id: string
  title: string
  category: string
  description: string
  icon: string
  markdown: string
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'redes-computadoras',
    title: 'Fundamentos de Redes de Computadoras',
    category: 'Redes y Telecomunicaciones',
    description: 'Mapa conceptual completo sobre conceptos fundamentales, arquitecturas, taxonomía, protocolos, capas y diseño de redes.',
    icon: 'Network',
    markdown: `# Fundamentos de Redes de Computadoras

Visión global, taxonomía, modelos y principios de diseño de las redes de computadoras modernas e Internet.

## Conceptos Fundamentales

Bases conceptuales para entender el intercambio de datos entre sistemas autónomos.

- **Red vs. Transmisión de Datos**: Diferencia entre el canal físico de señales y el sistema distribuido coordinado de nodos interconectados.
- **Definición Formal: Nodos Autónomos + Medio Compartido**: Conjunto de dispositivos con procesamiento propio capaces de comunicarse a través de un canal o enlace compartido.
- **Casos Testigo (Bus E/S, CCTV, Cámara IP)**: Ejemplos prácticos donde la arquitectura de red reemplaza los buses punto a punto tradicionales.

## Arquitecturas de Aplicación

Modelos de organización lógica de los servicios y procesos distribuidos.

- **Cliente-Servidor (Asimetría)**: Servidor dedicado siempre activo con dirección IP fija atendiendo solicitudes de clientes intermitentes.
- **Par a Par (P2P: Simetría, Escalabilidad)**: Nodos equivalentes que actúan simultáneamente como clientes y servidores, auto-escalando con la demanda.
- **Híbridas (Skype, BitTorrent)**: Combinación de servidores centrales para indexación/autenticación y transferencias directas descentralizadas entre pares.

## Taxonomía por Escala Geográfica

Clasificación de las redes según su alcance territorial y tecnología de enlace.

- **PAN (Personal): Bluetooth, NFC**: Redes de área personal de corto alcance (hasta 10m) centradas en el usuario y sus periféricos.
- **LAN (Local): Ethernet, Wi-Fi, Switches**: Redes de área local en edificios o campus con altas tasas de transferencia y baja tasa de error.
- **MAN (Metropolitana): HFC DOCSIS, Barreras Admin.**: Redes de cobertura urbana que integran telecomunicaciones públicas y privadas.

## Redes de Acceso ('Última Milla')

Tecnologías que conectan a los usuarios residenciales y corporativos al primer router de borde.

- **Medios Guiados (Cobre, Coaxial, Fibra FTTH)**: Transmisión física a través de par trenzado UTP, cable coaxial y fibra óptica de alta capacidad.
- **Medios No Guiados (Celulares, Satelitales LEO)**: Propagación de ondas electromagnéticas en el espacio libre (4G/5G, constelaciones Starlink).

## Arquitectura de Internet

Estructura jerárquica global que permite la interconexión mundial de redes independientes (Sistemas Autónomos).

- **Jerarquía de ISPs (Tier 1, 2, 3)**: Tránsito global provisto por operadores Tier 1 interconectados mediante IXPs (Internet Exchange Points).
- **CDNs (Edge Caching, Baja Latencia)**: Redes de entrega de contenido distribuidas geográficamente para servir recursos estáticos cerca del usuario.
- **Hyperscalers (Propios Backbones)**: Infraestructuras de red privadas globales de gigantes tecnológicos (Google, Cloudflare, AWS).

## Objetivos de Diseño de Redes

Criterios y métricas de ingeniería que determinan la calidad y robustez de una red.

- **Confiabilidad, Eficiencia, Evolución, Seguridad**: Principios guía para soportar crecimiento exponencial y nuevas aplicaciones sin degradación.
- **Control de Flujo vs. Congestión vs. QoS**: Mecanismos para regular velocidad emisor-receptor, proteger la red y priorizar tráfico crítico.
- **Tríada CIA (Confidencialidad, Integridad, Disponibilidad)**: Pilares de ciberseguridad para proteger la información en tránsito.

## Paradigmas de Conmutación

Modelos de transferencia de información a través de nodos intermedios.

- **Circuitos (PSTN, Fija, Reservada)**: Reserva de canal físico exclusivo de extremo a extremo durante toda la comunicación telefónica.
- **Paquetes (Internet, Dinámica, Compartida)**: Fragmentación de datos en paquetes independientes transmitidos por multiplexación estadística.
- **Orientación a Conexión vs. Sin Conexión**: Comparación entre flujos con handshake previo (TCP) y datagramas sin confirmación (UDP).

## Redes Inalámbricas y Telefonía

Principios de comunicación inalámbrica y sistemas móviles celulares.

- **Evolución Celular (1G a 5G)**: Desde voz analógica (1G) y digitalización (2G) hasta banda ancha masiva y ultra baja latencia (5G).
- **Wi-Fi (IEEE 802.11, Bandas ISM)**: Estándares de redes inalámbricas locales operando en bandas no licenciadas (2.4 GHz, 5 GHz, 6 GHz).
- **Fenómenos Físicos (Multipath, Hidden Node, CSMA/CA)**: Desafíos de interferencia, desvanecimiento y protocolo de acceso múltiple con evasión de colisiones.

## Arquitectura en Capas

Estructuración modular de funciones de comunicación para reducir complejidad.

- **Abstracción y Encapsulación (PDU)**: Cada nivel agrega su propia cabecera (Header) a los datos recibidos de la capa superior.
- **Modelos: OSI (7) vs. Híbrido (5)**: Comparación pedagógica entre el modelo teórico ISO/OSI y el modelo práctico TCP/IP de 5 capas.
- **Dispositivos (Hub, Switch, Router)**: Equipamiento por capa: Hub (Física), Switch (Enlace L2), Router (Red L3).

## Primitivas de Servicio y Sockets

Interfaz de programación que vincula las aplicaciones con la pila de protocolos del kernel.

- **Primitivas Fundamentales (LISTEN, CONNECT, ACCEPT)**: Llamadas al sistema para inicializar conexiones y gestionar flujos bidireccionales.
- **API de Sockets (5-tupla)**: Identificación unívoca de flujo: IP Origen, Puerto Origen, IP Destino, Puerto Destino, Protocolo.
- **Multiplexación por Puertos**: Capacidad de ejecutar múltiples servicios concurrentes (HTTP:80, HTTPS:443, SSH:22) en una misma máquina.

## Estandarización y Geopolítica

Organizaciones y regulaciones que gobiernan la interoperabilidad global.

- **Organismos (ITU-T, IEEE, IETF)**: Entidades técnicas de estandarización abiertas (RFCs) y comités de telecomunicaciones.
- **Firmware y Neutralidad de la Red**: Principio donde los proveedores de acceso deben tratar todo el tráfico de datos por igual sin discriminación.

## Unidades de Medida

Factores de conversión y convenciones métricas en telecomunicaciones y sistemas.

- **Bits (Redes) vs. Bytes (SO)**: Las redes miden tasas en bits por segundo ($bps$), mientras los sistemas operativos miden almacenamiento en bytes ($B$).
- **Prefijos Decimales vs. Binarios**: Diferencia entre prefijos SI ($10^3 = 1000$) y prefijos binarios IEC ($2^{10} = 1024$).
- **Regla Práctica: Mbps a MB/s**: Dividir la velocidad de conexión por 8 para estimar la tasa real de descarga efectiva.`
  },
  {
    id: 'software-architecture',
    title: 'Arquitectura de Software y Sistemas Distribuidos',
    category: 'Ingeniería de Software',
    description: 'Patrones arquitectónicos, Clean Architecture, diseño de microservicios, consistencia eventual y escalabilidad.',
    icon: 'Layers',
    markdown: `# Arquitectura de Software y Sistemas Distribuidos

Guía fundamental y mapa de estudio para diseñar sistemas escalables, modulares y tolerantes a fallos.

## Principios de Diseño Fundamental

Los cimientos de cualquier arquitectura orientada a la mantenibilidad y desacoplamiento.

- **Single Responsibility (SRP)**: Una clase o módulo debe tener una única razón para cambiar.
- **Open/Closed Principle (OCP)**: Abierto para la extensión pero cerrado a la modificación.
- **Liskov Substitution (LSP)**: Subclases sustituibles sin alterar la corrección del programa.
- **Dependency Inversion (DIP)**: Depender de abstracciones, no de implementaciones concretas.

## Clean Architecture por Capas

Independencia de frameworks, bases de datos y detalles de interfaz gráfica.

- **Dominio y Entidades**: Lógica de negocio pura e invariantes empresariales.
- **Casos de Uso**: Orquestación del flujo de datos de aplicación.
- **Adaptadores y Repositorios**: Controladores, pasarelas de pago y persistencia.

## Arquitectura de Microservicios

Descomposición de monolitos en servicios autónomos desplegables independientemente.

- **Patrones de Comunicación**: REST sincrónico y mensajería orientada a eventos.
- **Patrón Saga**: Transacciones distribuidas orquestadas o coreografiadas.
- **Teorema CAP**: Balance entre consistencia, disponibilidad y particiones.`
  }
]
