// AdminPanel.tsx - Tamamlanmış Kod

// ... (Yukarıdaki importlarınız aynı kalacak) ...

// ===================== SOHBET MANAGER =====================
function SohbetManager({ sohbet, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <GenericForm title="Sohbet" item={editing} onSave={editing ? (d:any) => onUpdate(editing.id, d) : onAdd} onClose={() => {setEditing(null); setShowForm(false);}} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Yeni Sohbet Ekle" onClick={() => setShowForm(true)} />
      {sohbet.map((item: any) => (
        <div key={item.id} className="bg-white p-3 mb-2 rounded-xl border flex justify-between items-center">
          <span>{item.title}</span>
          <ActionButtons onEdit={() => setEditing(item)} onDelete={() => onDelete(item.id)} />
        </div>
      ))}
    </div>
  );
}

// ===================== STAFF MANAGER =====================
function StaffManager({ staff, onAdd, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  if (showForm || editing) {
    return <GenericForm title="Kadro" item={editing} onSave={editing ? (d:any) => onUpdate(editing.id, d) : onAdd} onClose={() => {setEditing(null); setShowForm(false);}} />;
  }

  return (
    <div className="p-4">
      <AddButton label="Kadro Üyesi Ekle" onClick={() => setShowForm(true)} />
      {staff.map((item: any) => (
        <div key={item.id} className="bg-white p-3 mb-2 rounded-xl border flex justify-between items-center">
          <span>{item.name}</span>
          <ActionButtons onEdit={() => setEditing(item)} onDelete={() => onDelete(item.id)} />
        </div>
      ))}
    </div>
  );
}

// ===================== GENEL FORM (Sohbet/Staff için) =====================
function GenericForm({ title, item, onSave, onClose }: any) {
  const [val, setVal] = useState(item?.title ?? item?.name ?? '');
  return (
    <div className="p-4 space-y-4">
      <BackButton onClick={onClose} />
      <input className={inputClass} value={val} onChange={e => setVal(e.target.value)} placeholder={`${title} başlığı...`} />
      <div className="flex gap-2">
        <button className="flex-1 bg-[#C5A880] text-white p-3 rounded" onClick={() => {onSave({title: val, name: val}); onClose();}}>Kaydet</button>
      </div>
    </div>
  );
}
