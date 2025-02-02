import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";

// Modal de confirmación
interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-md">
                <p>{message}</p>
                <div className="mt-4">
                    <Button onClick={onConfirm} variant="destructive" className="mr-4">Sí</Button>
                    <Button onClick={onCancel}>No</Button>
                </div>
            </div>
        </div>
    );
};

interface Area {
    id_area: number;
    nombre_area: string;
}

interface AsignarAreaACursoProps {
    cursoId: number;
    onCreate: () => void;
}

const AsignarAreaACurso: React.FC<AsignarAreaACursoProps> = ({ cursoId, onCreate }) => {
    const [areasDisponibles, setAreasDisponibles] = useState<Area[]>([]);
    const [areasSeleccionadas, setAreasSeleccionadas] = useState<Area[]>([]);
    const [areasOriginales, setAreasOriginales] = useState<Area[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [actionType, setActionType] = useState<'assign' | 'remove' | 'none'>('none');
    const [areaToRemove, setAreaToRemove] = useState<Area | null>(null); // Para almacenar área a eliminar

    // Cargar áreas disponibles y asignadas al curso
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/area/');
                if (!response.ok) throw new Error('Failed to fetch areas');
                const allAreas = await response.json();
                
                const response2 = await fetch(`http://localhost:3000/api/cursoArea/${cursoId}`);
                if (!response2.ok) throw new Error('Failed to fetch assigned areas');
                const assignedAreas = await response2.json();
                
                // Guardar áreas asignadas
                setAreasSeleccionadas(assignedAreas);
                setAreasOriginales(assignedAreas);
                
                // Filtrar áreas disponibles para excluir las ya asignadas
                const assignedAreaIds = new Set(assignedAreas.map((area: Area) => area.id_area));
                const availableAreas = allAreas.filter((area: Area) => !assignedAreaIds.has(area.id_area));
                setAreasDisponibles(availableAreas);
            } catch (error) {
                console.error('Error fetching areas:', error);
                toast.error("Error al cargar las áreas");
            }
        };

        fetchAreas();
    }, [cursoId]);

    // Lógica para quitar área
    const handleRemoveArea = (area: Area) => {
        setAreaToRemove(area);
        setModalMessage(`¿Estás seguro de que deseas eliminar el área "${area.nombre_area}" de este curso?`);
        setActionType('remove');
        setIsModalOpen(true);
    };
    const handleSelectArea = (areaId: string) => {
        const selectedAreaId = parseInt(areaId);
        const selectedArea = areasDisponibles.find(area => area.id_area === selectedAreaId);

        if (selectedArea) {
            setAreasSeleccionadas(prev => [...prev, selectedArea]);
            setAreasDisponibles(prev => prev.filter(area => area.id_area !== selectedArea.id_area));
        }
    };

    // Confirmar la eliminación
    const confirmAction = async () => {
        if (actionType === 'remove' && areaToRemove) {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/api/cursoArea/${cursoId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ areaId: areaToRemove.id_area }),
                });
                if (!response.ok) throw new Error('Failed to remove area');
                
                // Actualizar las listas
                setAreasSeleccionadas(prev => prev.filter(area => area.id_area !== areaToRemove.id_area));
                setAreasDisponibles(prev => [...prev, areaToRemove].sort((a, b) => 
                    a.nombre_area.localeCompare(b.nombre_area)
                ));
                
                toast.success("Área desasignada correctamente");
            } catch (error) {
                console.error('Error removing area:', error);
                toast.error("Error al desasignar el área");
            } finally {
                setIsLoading(false);
            }
        }
        setIsModalOpen(false);
    };

    const cancelAction = () => {
        setIsModalOpen(false);
    };

    const handleConfirmChanges = async () => {
        setIsLoading(true);
        try {
            // Obtener IDs de las áreas seleccionadas
            const selectedAreaIds = areasSeleccionadas.map(area => area.id_area);
            
            // Realizar la asignación de las áreas al curso
            const response = await fetch(`http://localhost:3000/api/cursoArea/${cursoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ areaIds: selectedAreaIds }),
            });

            if (!response.ok) throw new Error('Error al asignar áreas');
            
            toast.success("Áreas asignadas correctamente");
            onCreate(); // Notificar al componente padre
        } catch (error) {
            console.error('Error saving areas:', error);
            toast.error("Error al asignar las áreas");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Asignar Áreas al Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Selector de áreas */}
                <div className="space-y-2">
                    <label htmlFor="areaSelect" className="block text-sm font-medium text-gray-700">
                        Seleccionar área:
                    </label>
                    <Select onValueChange={handleSelectArea}>
                        <SelectTrigger>
                            <SelectValue placeholder={
                                areasDisponibles.length === 0 
                                    ? "No hay áreas disponibles" 
                                    : "Seleccione un área"
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {areasDisponibles.length === 0 ? (
                                <SelectItem value="none" disabled>
                                    No hay áreas disponibles
                                </SelectItem>
                            ) : (
                                areasDisponibles
                                    .sort((a, b) => a.nombre_area.localeCompare(b.nombre_area))
                                    .map(area => (
                                        <SelectItem 
                                            key={area.id_area.toString()} 
                                            value={area.id_area.toString()}
                                        >
                                            {area.nombre_area}
                                        </SelectItem>
                                    ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Áreas seleccionadas */}
                <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Áreas Seleccionadas:</h3>
                    <ul className="space-y-2">
                        {areasSeleccionadas.map(area => (
                            <li key={area.id_area} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                <span>{area.nombre_area}</span>
                                <Button
                                    type="button"
                                    onClick={() => handleRemoveArea(area)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Quitar
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter>
                <Button 
                    type="button" 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={handleConfirmChanges}
                >
                    {isLoading ? 'Procesando...' : 'Confirmar cambios'}
                </Button>
            </CardFooter>

            {/* Modal de confirmación */}
            <ConfirmationModal
                isOpen={isModalOpen}
                message={modalMessage}
                onConfirm={confirmAction}
                onCancel={cancelAction}
            />
        </Card>
    );
};

export default AsignarAreaACurso;
