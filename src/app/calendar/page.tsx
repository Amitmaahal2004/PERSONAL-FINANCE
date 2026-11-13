'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  HandCoins,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { ITransaction, IRecurringTransaction, ILoan } from '@/types';

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [recurringList, setRecurringList] = useState<IRecurringTransaction[]>([]);
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

      const [txRes, recRes, loanRes] = await Promise.all([
        fetch(`/api/transactions?startDate=${startOfMonth}&endDate=${endOfMonth}&limit=100`),
        fetch('/api/recurring'),
        fetch('/api/loans'),
      ]);

      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
      if (recRes.ok) {
        const data = await recRes.json();
        setRecurringList(data.recurring || []);
      }
      if (loanRes.ok) {
        const data = await loanRes.json();
        setLoans(data.loans || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Group events by day of current month
  const txByDay = new Map<number, ITransaction[]>();
  for (const t of transactions) {
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      const list = txByDay.get(dayNum) || [];
      list.push(t);
      txByDay.set(dayNum, list);
    }
  }

  const recurringByDay = new Map<number, IRecurringTransaction[]>();
  for (const r of recurringList) {
    const d = new Date(r.nextDueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      const list = recurringByDay.get(dayNum) || [];
      list.push(r);
      recurringByDay.set(dayNum, list);
    }
  }

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedTransactions = selectedDay ? txByDay.get(selectedDay) || [] : [];
  const selectedRecurring = selectedDay ? recurringByDay.get(selectedDay) || [] : [];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Financial Activity Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Visual roadmap of past transactions and upcoming payment dues.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-subtle">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm text-slate-900 px-2 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CALENDAR & SELECTED DAY PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (2 Cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-2xl" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDay === day;
                const dayTxs = txByDay.get(day) || [];
                const dayRecs = recurringByDay.get(day) || [];
                const hasIncome = dayTxs.some((t) => t.type === 'income');
                const hasExpense = dayTxs.some((t) => t.type === 'expense');
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl flex flex-col justify-between transition border text-left ${isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : isToday
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${isSelected
                          ? 'text-emerald-700'
                          : isToday
                            ? 'w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]'
                            : 'text-slate-800'
                          }`}
                      >
                        {day}
                      </span>

                      {dayRecs.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Recurring Due" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-auto">
                      {hasIncome && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Income" />}
                      {hasExpense && <span className="w-2 h-2 rounded-full bg-rose-500" title="Expense" />}
                      {dayTxs.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400">+{dayTxs.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Sidebar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : 'Select a Day'}
                  </h3>
                  <p className="text-xs text-slate-400">Activity on this date</p>
                </div>
              </div>

              {selectedDay && (
                <div className="space-y-4">
                  {/* Recurring dues on this day */}
                  {selectedRecurring.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                        Recurring Dues
                      </span>
                      {selectedRecurring.map((r) => (
                        <div
                          key={r._id}
                          className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-purple-900">{r.title}</div>
                            <span className="text-[10px] text-purple-600">{r.frequency}</span>
                          </div>
                          <span className="font-bold text-purple-900">{formatCurrency(r.amount, cur, sym)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transactions on this day */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Transactions ({selectedTransactions.length})
                    </span>

                    {selectedTransactions.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No transactions recorded on this date.
                      </div>
                    ) : (
                      selectedTransactions.map((tx) => (
                        <div
                          key={tx._id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}
                            >
                              {tx.type === 'income' ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{tx.title}</div>
                              <span className="text-[10px] text-slate-400">
                                {tx.category} • {tx.account}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount, cur, sym)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Expense
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Recurring
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

