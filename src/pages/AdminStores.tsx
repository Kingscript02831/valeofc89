import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash, Plus, Search } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import type { Database } from "../integrations/supabase/types";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import type { Store, StoreFormData } from "../types/stores";

const AdminStores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    name: "",
    address: "",
    description: "",
    maps_url: "",
    owner_name: "",
    phone: "",
    whatsapp: "",
    website: "",
    image: "",
    entrance_fee: "",
    opening_hours: "",
    social_media: {
      facebook: "",
      instagram: "",
    },
  });

  // Fetch stores
  const { data: stores, isLoading } = useQuery({
    queryKey: ["admin-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Filter stores based on search term
  const filteredStores = stores?.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("social_media.")) {
      const socialMedia = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        social_media: {
          ...(prev.social_media as any),
          [socialMedia]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      description: "",
      maps_url: "",
      owner_name: "",
      phone: "",
      whatsapp: "",
      website: "",
      image: "",
      entrance_fee: "",
      opening_hours: "",
      social_media: {
        facebook: "",
        instagram: "",
      },
    });
    setSelectedStore(null);
  };

  // Handle add/edit submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro ao salvar a loja",
          description: "Você precisa estar logado para realizar esta ação.",
          variant: "destructive",
        });
        return;
      }

      if (selectedStore) {
        // Update existing store
        const { error } = await supabase
          .from("stores")
          .update(formData)
          .eq("id", selectedStore.id);

        if (error) throw error;
        toast({
          title: "Loja atualizada com sucesso!",
          variant: "default",
        });
      } else {
        // Add new store - ensure required fields are present
        if (!formData.name || !formData.address || !formData.description) {
          toast({
            title: "Erro ao salvar a loja",
            description: "Nome, endereço e descrição são obrigatórios.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from("stores")
          .insert({ ...formData, user_id: user.id });

        if (error) throw error;
        toast({
          title: "Loja adicionada com sucesso!",
          variant: "default",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      setIsAddEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving store:", error);
      toast({
        title: "Erro ao salvar a loja",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle store deletion
  const handleDelete = async () => {
    if (!selectedStore) return;

    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", selectedStore.id);

      if (error) throw error;

      toast({
        title: "Loja excluída com sucesso!",
        variant: "default",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      setIsDeleteDialogOpen(false);
      setSelectedStore(null);
    } catch (error) {
      console.error("Error deleting store:", error);
      toast({
        title: "Erro ao excluir a loja",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle edit click
  const handleEditClick = (store: Store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      description: store.description,
      address: store.address,
      maps_url: store.maps_url || "",
      owner_name: store.owner_name || "",
      phone: store.phone || "",
      whatsapp: store.whatsapp || "",
      website: store.website || "",
      image: store.image || "",
      entrance_fee: store.entrance_fee || "",
      opening_hours: store.opening_hours || "",
      social_media: store.social_media || { facebook: "", instagram: "" },
    });
    setIsAddEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsAddEditDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStore ? "Editar Loja" : "Adicionar Nova Loja"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Endereço *
                  </label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descrição *
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="owner_name" className="text-sm font-medium">
                    Nome do Proprietário
                  </label>
                  <Input
                    id="owner_name"
                    name="owner_name"
                    value={formData.owner_name || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="opening_hours" className="text-sm font-medium">
                    Horário de Funcionamento
                  </label>
                  <Input
                    id="opening_hours"
                    name="opening_hours"
                    value={formData.opening_hours || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Segunda a Sexta 9h às 18h"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="entrance_fee" className="text-sm font-medium">
                    Valor da Entrada
                  </label>
                  <Input
                    id="entrance_fee"
                    name="entrance_fee"
                    value={formData.entrance_fee || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: R$ 20,00"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maps_url" className="text-sm font-medium">
                    Link do Google Maps
                  </label>
                  <Input
                    id="maps_url"
                    name="maps_url"
                    value={formData.maps_url || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="whatsapp" className="text-sm font-medium">
                    WhatsApp
                  </label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium">
                    Website
                  </label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-medium">
                    URL da Imagem
                  </label>
                  <Input
                    id="image"
                    name="image"
                    value={formData.image || ""}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Redes Sociais */}
                <div className="space-y-2">
                  <label
                    htmlFor="social_media.facebook"
                    className="text-sm font-medium"
                  >
                    Facebook
                  </label>
                  <Input
                    id="social_media.facebook"
                    name="social_media.facebook"
                    value={(formData.social_media as any)?.facebook || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="social_media.instagram"
                    className="text-sm font-medium"
                  >
                    Instagram
                  </label>
                  <Input
                    id="social_media.instagram"
                    name="social_media.instagram"
                    value={(formData.social_media as any)?.instagram || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddEditDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedStore ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            className="pl-10"
            placeholder="Pesquisar lojas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proprietário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStores?.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{store.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.owner_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(store)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStore(store);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta loja? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminStores;
