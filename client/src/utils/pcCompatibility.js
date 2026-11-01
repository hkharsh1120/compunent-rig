
const getCompatibility = (product) => product?.compatibility || {};

const normalize = (value) => String(value || '').trim().toLowerCase();

export const checkPCCompatibility = (selectedComponents) => {
    const errors = [];
    const warnings = [];

    const cpu = selectedComponents.cpu;
    const motherboard = selectedComponents.motherboard;
    const ram = selectedComponents.ram;
    const gpu = selectedComponents.gpu;
    const storage = selectedComponents.storage;
    const psu = selectedComponents.psu;

    // 1. CPU and motherboard socket
    if (cpu && motherboard) {
        const cpuSocket = getCompatibility(cpu).socket;
        const motherboardSocket = getCompatibility(motherboard).socket;

        if (cpuSocket && motherboardSocket) {
            if (normalize(cpuSocket) !== normalize(motherboardSocket)) {
                errors.push(
                    `CPU socket (${cpuSocket}) does not match motherboard socket (${motherboardSocket}).`
                );
            }
        } else {
            warnings.push(
                'CPU or motherboard socket information is missing.'
            );
        }
    }

    // 2. Motherboard and RAM generation
    if (motherboard && ram) {
        const motherboardRam = getCompatibility(motherboard).ramType;
        const ramType = getCompatibility(ram).ramType;

        if (motherboardRam && ramType) {
            if (normalize(motherboardRam) !== normalize(ramType)) {
                errors.push(
                    `RAM type (${ramType}) is incompatible with motherboard RAM type (${motherboardRam}).`
                );
            }
        } else {
            warnings.push(
                'Motherboard or RAM type information is missing.'
            );
        }
    }

    // 3. Motherboard maximum RAM capacity
    if (motherboard && ram) {
        const maxRamCapacity = Number(
            getCompatibility(motherboard).maxRamCapacity
        );

        const ramCapacity = Number(
            getCompatibility(ram).capacity
        );

        if (maxRamCapacity > 0 && ramCapacity > 0) {
            if (ramCapacity > maxRamCapacity) {
                errors.push(
                    `Selected RAM capacity (${ramCapacity}GB) exceeds motherboard maximum (${maxRamCapacity}GB).`
                );
            }
        } else {
            warnings.push(
                'Motherboard maximum RAM capacity or RAM capacity information is missing.'
            );
        }
    }

    // 4. GPU and PSU wattage
    if (gpu && psu) {
        const recommendedWattage = Number(
            getCompatibility(gpu).recommendedPsuWattage
        );

        const psuWattage = Number(
            getCompatibility(psu).wattage
        );

        if (recommendedWattage > 0 && psuWattage > 0) {
            if (psuWattage < recommendedWattage) {
                errors.push(
                    `PSU provides ${psuWattage}W, but GPU recommends at least ${recommendedWattage}W.`
                );
            }
        } else {
            warnings.push(
                'GPU recommended PSU wattage or PSU wattage is missing.'
            );
        }
    }

    // 5. Storage and motherboard interface
    if (storage && motherboard) {
        const storageInterface = getCompatibility(storage).interface;

        const supportedInterfaces =
            getCompatibility(motherboard).supportedStorageInterfaces || [];

        if (storageInterface && supportedInterfaces.length > 0) {
            const isSupported = supportedInterfaces.some(
                (item) => normalize(item) === normalize(storageInterface)
            );

            if (!isSupported) {
                errors.push(
                    `Motherboard does not list support for ${storageInterface} storage.`
                );
            }
        } else {
            warnings.push(
                'Storage interface or motherboard supported storage interfaces are missing.'
            );
        }
    }

    return {
        isCompatible: errors.length === 0,
        errors,
        warnings,
    };
};
