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
      <div className="calendar">
        {/* HEADER */}
        <div className="calendar-header">
          <div className="calendar-header-info">
            <h1 className="calendar-title">
              Financial Activity Calendar
            </h1>
            <p className="calendar-description">
              Visual roadmap of past transactions and upcoming payment dues.
            </p>
          </div>

          <div className="calendar-nav">
            <button
              onClick={prevMonth}
              className="calendar-nav-btn"
              aria-label="Previous Month"
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <span className="calendar-month-label">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="calendar-nav-btn"
              aria-label="Next Month"
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* CALENDAR & SELECTED DAY PANEL */}
        <div className="calendar-layout">
          {/* Calendar Grid */}
          <div className="calendar-main">
            {/* Days of week header */}
            <div className="calendar-weekdays">
              <span className="calendar-weekday">Sun</span>
              <span className="calendar-weekday">Mon</span>
              <span className="calendar-weekday">Tue</span>
              <span className="calendar-weekday">Wed</span>
              <span className="calendar-weekday">Thu</span>
              <span className="calendar-weekday">Fri</span>
              <span className="calendar-weekday">Sat</span>
            </div>

            {/* Calendar Cells */}
            <div className="calendar-grid">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-slot-empty" />
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
                    className={`calendar-day ${
                      isSelected
                        ? 'calendar-day-selected'
                        : isToday
                        ? 'calendar-day-today'
                        : ''
                    }`}
                  >
                    <div className="calendar-day-top">
                      <span
                        className={
                          isToday
                            ? 'calendar-day-number-today'
                            : 'calendar-day-number'
                        }
                      >
                        {day}
                      </span>

                      {dayRecs.length > 0 && (
                        <span className="calendar-dot-recurring" title="Recurring Due" />
                      )}
                    </div>

                    <div className="calendar-day-dots">
                      {hasIncome && <span className="calendar-dot-income" title="Income" />}
                      {hasExpense && <span className="calendar-dot-expense" title="Expense" />}
                      {dayTxs.length > 2 && (
                        <span className="calendar-more-count">+{dayTxs.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail Sidebar */}
          <div className="calendar-sidebar">
            <div>
              <div className="calendar-sidebar-header">
                <div>
                  <h3 className="calendar-sidebar-title">
                    {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : 'Select a Day'}
                  </h3>
                  <p className="calendar-sidebar-subtitle">Activity on this date</p>
                </div>
              </div>

              {selectedDay && (
                <div>
                  {/* Recurring dues on this day */}
                  {selectedRecurring.length > 0 && (
                    <div className="calendar-section">
                      <span className="calendar-section-title calendar-section-title-purple">
                        Recurring Dues
                      </span>
                      {selectedRecurring.map((r) => (
                        <div
                          key={r._id}
                          className="calendar-event-item calendar-event-item-recurring"
                        >
                          <div>
                            <div className="calendar-event-title">{r.title}</div>
                            <span className="calendar-event-meta">{r.frequency}</span>
                          </div>
                          <span className="calendar-event-amount">{formatCurrency(r.amount, cur, sym)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transactions on this day */}
                  <div className="calendar-section">
                    <span className="calendar-section-title">
                      Transactions ({selectedTransactions.length})
                    </span>

                    {selectedTransactions.length === 0 ? (
                      <div className="calendar-event-empty">
                        No transactions recorded on this date.
                      </div>
                    ) : (
                      selectedTransactions.map((tx) => (
                        <div
                          key={tx._id}
                          className="calendar-event-item"
                        >
                          <div className="calendar-event-info">
                            <div
                              className={`calendar-event-icon ${
                                tx.type === 'income' ? 'calendar-event-icon-income' : 'calendar-event-icon-expense'
                              }`}
                            >
                              {tx.type === 'income' ? (
                                <ArrowDownLeft style={{ width: 14, height: 14 }} />
                              ) : (
                                <ArrowUpRight style={{ width: 14, height: 14 }} />
                              )}
                            </div>
                            <div>
                              <div className="calendar-event-title">{tx.title}</div>
                              <span className="calendar-event-meta">
                                {tx.category} • {tx.account}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`calendar-event-amount ${
                              tx.type === 'income' ? 'calendar-event-amount-income' : ''
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

            <div className="calendar-legend">
              <span className="calendar-legend-item">
                <span className="calendar-legend-dot calendar-legend-dot-income" /> Income
              </span>
              <span className="calendar-legend-item">
                <span className="calendar-legend-dot calendar-legend-dot-expense" /> Expense
              </span>
              <span className="calendar-legend-item">
                <span className="calendar-legend-dot calendar-legend-dot-recurring" /> Recurring
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

