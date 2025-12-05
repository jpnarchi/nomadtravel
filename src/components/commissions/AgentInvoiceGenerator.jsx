import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, User as UserIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function AgentInvoiceGenerator({ open, onClose, services, soldTrips }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    business_name: '',
    address: '',
    email: '',
    phone: '',
    rfc: '',
    bank_name: '',
    account_holder: '',
    clabe: ''
  });
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    travel_reference: '',
    description: 'Commission payment for trip referenced above per agreed split.'
  });
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUser();
    }
  }, [open]);

  const fetchUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Check if user has required profile data
      const hasProfile = currentUser.rfc && currentUser.address && currentUser.phone && 
                        currentUser.bank_name && currentUser.clabe;
      
      if (!hasProfile) {
        setNeedsProfile(true);
        setProfileData({
          full_name: currentUser.full_name || '',
          business_name: currentUser.business_name || '',
          address: currentUser.address || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          rfc: currentUser.rfc || '',
          bank_name: currentUser.bank_name || '',
          account_holder: currentUser.account_holder || currentUser.full_name || '',
          clabe: currentUser.clabe || ''
        });
      } else {
        setProfileData({
          full_name: currentUser.full_name,
          business_name: currentUser.business_name || '',
          address: currentUser.address,
          email: currentUser.email,
          phone: currentUser.phone,
          rfc: currentUser.rfc,
          bank_name: currentUser.bank_name,
          account_holder: currentUser.account_holder || currentUser.full_name,
          clabe: currentUser.clabe
        });
        
        // Generate auto invoice number
        const year = new Date().getFullYear();
        const nextNumber = (currentUser.last_invoice_number || 0) + 1;
        const autoNumber = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
        setAutoInvoiceNumber(autoNumber);
        setInvoiceData(prev => ({ ...prev, invoice_number: autoNumber }));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      await base44.auth.updateMe({
        business_name: profileData.business_name,
        address: profileData.address,
        phone: profileData.phone,
        rfc: profileData.rfc,
        bank_name: profileData.bank_name,
        account_holder: profileData.account_holder,
        clabe: profileData.clabe
      });
      setNeedsProfile(false);
      toast.success('Perfil actualizado');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!invoiceData.invoice_number || !invoiceData.due_date || !invoiceData.travel_reference) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setGenerating(true);

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('INVOICE', 105, yPos, { align: 'center' });
      yPos += 15;

      // Freelance Advisor Information
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Freelance Advisor / Sender Information', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${profileData.full_name}`, 20, yPos);
      yPos += 5;
      if (profileData.business_name) {
        doc.text(`Business Name: ${profileData.business_name}`, 20, yPos);
        yPos += 5;
      }
      doc.text(`Address: ${profileData.address}`, 20, yPos);
      yPos += 5;
      doc.text(`Email: ${profileData.email}`, 20, yPos);
      yPos += 5;
      doc.text(`Phone: ${profileData.phone}`, 20, yPos);
      yPos += 5;
      doc.text(`RFC: ${profileData.rfc}`, 20, yPos);
      yPos += 10;

      // Bill To
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To:', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Nomad Travel LLC', 20, yPos);
      yPos += 5;
      doc.text('3702 San Efrain Street', 20, yPos);
      yPos += 5;
      doc.text('Mission, TX 78572', 20, yPos);
      yPos += 5;
      doc.text('USA', 20, yPos);
      yPos += 5;
      doc.text('Email: info@nomadtravel.mx', 20, yPos);
      yPos += 5;
      doc.text('Tax ID: 99-0692205', 20, yPos);
      yPos += 10;

      // Invoice Details
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Invoice Details', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Invoice Number: ${invoiceData.invoice_number}`, 20, yPos);
      yPos += 5;
      doc.text(`Invoice Date: ${invoiceData.invoice_date}`, 20, yPos);
      yPos += 5;
      doc.text(`Due Date: ${invoiceData.due_date}`, 20, yPos);
      yPos += 5;
      doc.text(`Travel Reference / Client Name: ${invoiceData.travel_reference}`, 20, yPos);
      yPos += 10;

      // Description
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Description of Services / Commission Payment:', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const descLines = doc.splitTextToSize(invoiceData.description, 170);
      doc.text(descLines, 20, yPos);
      yPos += (descLines.length * 5) + 5;

      // Commission Breakdown Table
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Commission Breakdown', 20, yPos);
      yPos += 7;

      // Table Header
      doc.setFillColor(46, 68, 42);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Item / Trip Component', 22, yPos + 5);
      doc.text('Amount Received', 90, yPos + 5);
      doc.text('Split %', 135, yPos + 5);
      doc.text('Amount Owed', 160, yPos + 5);
      yPos += 8;

      // Table Rows
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      let totalOwed = 0;

      services.forEach((service, index) => {
        const trip = soldTrips.find(t => t.id === service.sold_trip_id);
        const serviceName = getServiceName(service);
        const amountReceived = service.commission || 0;
        const agentSplit = 50;
        const amountOwed = amountReceived * 0.5;
        totalOwed += amountOwed;

        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 244);
          doc.rect(20, yPos - 4, 170, 6, 'F');
        }

        doc.text(serviceName.substring(0, 30), 22, yPos);
        doc.text(`$${amountReceived.toLocaleString()}`, 90, yPos);
        doc.text(`${agentSplit}%`, 135, yPos);
        doc.text(`$${amountOwed.toLocaleString()}`, 160, yPos);
        yPos += 6;
      });

      // Total
      yPos += 2;
      doc.setFont(undefined, 'bold');
      doc.setFillColor(46, 68, 42);
      doc.rect(20, yPos - 4, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Total Commission Owed:', 22, yPos);
      doc.text(`$${totalOwed.toLocaleString()}`, 160, yPos);
      yPos += 10;

      // Payment Instructions
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Payment Instructions (Agent\'s bank info)', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Bank Name: ${profileData.bank_name}`, 20, yPos);
      yPos += 5;
      doc.text(`Account Holder: ${profileData.account_holder}`, 20, yPos);
      yPos += 5;
      doc.text(`CLABE: ${profileData.clabe}`, 20, yPos);

      // Save PDF
      doc.save(`Invoice_${invoiceData.invoice_number}_${profileData.full_name.replace(/\s+/g, '_')}.pdf`);
      
      // Update last invoice number
      const invoiceMatch = invoiceData.invoice_number.match(/\d+$/);
      if (invoiceMatch) {
        const lastNumber = parseInt(invoiceMatch[0]);
        await base44.auth.updateMe({ last_invoice_number: lastNumber });
      }
      
      toast.success('Factura generada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar la factura');
    } finally {
      setGenerating(false);
    }
  };

  const getServiceName = (service) => {
    switch (service.service_type) {
      case 'hotel': return service.hotel_name || 'Hotel';
      case 'vuelo': return `${service.airline || 'Vuelo'} ${service.route || ''}`;
      case 'traslado': return `Traslado ${service.transfer_origin || ''} → ${service.transfer_destination || ''}`;
      case 'tour': return service.tour_name || 'Tour';
      case 'crucero': return `${service.cruise_ship || 'Crucero'} - ${service.cruise_itinerary || ''}`;
      default: return service.other_name || 'Servicio';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (needsProfile) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Completa tu perfil de facturación
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Para generar facturas, necesitamos tu información fiscal y bancaria. Esta información se guardará en tu perfil.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  value={profileData.full_name}
                  disabled
                  className="bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre del negocio (opcional)</Label>
                <Input
                  value={profileData.business_name}
                  onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                  placeholder="Ej: Mi Agencia de Viajes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección completa <span className="text-red-500">*</span></Label>
              <Textarea
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Calle, número, colonia, ciudad, estado, código postal"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={profileData.email}
                  disabled
                  className="bg-stone-100"
                />
              </div>

              <div className="space-y-2">
                <Label>Teléfono <span className="text-red-500">*</span></Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+52 123 456 7890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>RFC <span className="text-red-500">*</span></Label>
              <Input
                value={profileData.rfc}
                onChange={(e) => setProfileData({ ...profileData, rfc: e.target.value.toUpperCase() })}
                placeholder="ABCD123456XYZ"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Información Bancaria</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del banco <span className="text-red-500">*</span></Label>
                  <Input
                    value={profileData.bank_name}
                    onChange={(e) => setProfileData({ ...profileData, bank_name: e.target.value })}
                    placeholder="Ej: BBVA, Santander, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titular de la cuenta <span className="text-red-500">*</span></Label>
                  <Input
                    value={profileData.account_holder}
                    onChange={(e) => setProfileData({ ...profileData, account_holder: e.target.value })}
                    placeholder="Nombre completo del titular"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CLABE <span className="text-red-500">*</span></Label>
                  <Input
                    value={profileData.clabe}
                    onChange={(e) => setProfileData({ ...profileData, clabe: e.target.value })}
                    placeholder="18 dígitos"
                    maxLength={18}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={saveProfile}
                disabled={loading || !profileData.address || !profileData.phone || 
                         !profileData.rfc || !profileData.bank_name || !profileData.clabe}
                className="text-white"
                style={{ backgroundColor: '#2E442A' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar y continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generar Factura de Comisiones
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            Se generará una factura por <strong>{services.length} servicio(s)</strong> con un total de comisión del <strong>50%</strong>.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de factura <span className="text-red-500">*</span></Label>
              <Input
                value={invoiceData.invoice_number}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_number: e.target.value })}
                placeholder="Ej: INV-2025-001"
              />
              {autoInvoiceNumber && (
                <p className="text-xs text-stone-500">Sugerido: {autoInvoiceNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de factura</Label>
              <Input
                type="date"
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha de vencimiento <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={invoiceData.due_date}
              onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Referencia del viaje / Nombre del cliente <span className="text-red-500">*</span></Label>
            <Input
              value={invoiceData.travel_reference}
              onChange={(e) => setInvoiceData({ ...invoiceData, travel_reference: e.target.value })}
              placeholder="Ej: Japan Trip – Gonzalez Family"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={invoiceData.description}
              onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Servicios a facturar:</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {services.map((service, index) => {
                const trip = soldTrips.find(t => t.id === service.sold_trip_id);
                const serviceName = getServiceName(service);
                const amountOwed = (service.commission || 0) * 0.5;
                
                return (
                  <div key={index} className="flex justify-between items-center bg-stone-50 p-2 rounded text-sm">
                    <span className="flex-1">{serviceName}</span>
                    <span className="text-stone-500 mx-4">50%</span>
                    <span className="font-semibold" style={{ color: '#2E442A' }}>
                      ${amountOwed.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center bg-stone-800 text-white p-3 rounded mt-2">
              <span className="font-semibold">Total a facturar:</span>
              <span className="text-lg font-bold">
                ${(services.reduce((sum, s) => sum + ((s.commission || 0) * 0.5), 0)).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={generatePDF}
              disabled={generating}
              className="text-white"
              style={{ backgroundColor: '#2E442A' }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}