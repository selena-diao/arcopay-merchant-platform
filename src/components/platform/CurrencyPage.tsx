import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { CurrencyModal } from './CurrencyModal';
import { supabase } from '../../lib/supabase';
import { Currency } from '../../types';
import { useToast } from '../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { AlertDialogCancel } from '@radix-ui/react-alert-dialog';

export function CurrencyPage() {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('currencies')
      .select('code, name')
      .order('code');
    if (!error && data) setCurrencies(data as Currency[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: { code: string; name: string }) => {
    if (editingCurrency) {
      const { error } = await supabase
        .from('currencies')
        .update({ name: data.name })
        .eq('code', editingCurrency.code);
      if (error) {
        toast({ title: '操作失败', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: '币种已更新' });
    } else {
      const { error } = await supabase
        .from('currencies')
        .insert({ code: data.code, name: data.name });
      if (error) {
        toast({ title: '操作失败', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: '币种已创建' });
    }
    setModalOpen(false);
    setEditingCurrency(null);
    fetchCurrencies();
  };

  const handleDeleteClick = async (currency: Currency) => {
    const [{ count: cpmcurCount }, { count: txCount }] = await Promise.all([
      supabase.from('channel_payment_method_currency').select('*', { count: 'exact', head: true }).eq('currency_code', currency.code),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('currency', currency.code),
    ]);
    const referenced = (cpmcurCount ?? 0) > 0 || (txCount ?? 0) > 0;
    setDeleteTarget(currency);
    if (referenced) {
      setDeleteBlockedOpen(true);
    } else {
      setDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('currencies').delete().eq('code', deleteTarget.code);
    if (error) {
      toast({ title: '操作失败', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '币种已删除' });
      fetchCurrencies();
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">币种管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理系统中使用的币种代码与名称</p>
        </div>
        <Button onClick={() => { setEditingCurrency(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          新增币种
        </Button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索币种代码或名称…"
          className="pl-9"
        />
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-36">币种代码</TableHead>
              <TableHead>币种名称</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-slate-400">加载中…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12">
                  <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">{search ? '无匹配结果' : '暂无币种数据'}</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((currency) => (
                <TableRow key={currency.code} className="hover:bg-slate-50/60">
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded tracking-widest">
                      {currency.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-700">{currency.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        onClick={() => { setEditingCurrency(currency); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        onClick={() => handleDeleteClick(currency)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CurrencyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCurrency(null); }}
        onSave={handleSave}
        editingCurrency={editingCurrency}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="确认删除该币种？"
        description={`确认删除币种"${deleteTarget?.name}"（${deleteTarget?.code}）？此操作不可撤销。`}
        confirmLabel="删除"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
      />

      <AlertDialog open={deleteBlockedOpen} onOpenChange={(v) => { if (!v) { setDeleteBlockedOpen(false); setDeleteTarget(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>无法删除</AlertDialogTitle>
            <AlertDialogDescription>该币种代码已被使用，无法删除</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { setDeleteBlockedOpen(false); setDeleteTarget(null); }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 h-9 px-4"
            >
              知道了
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
