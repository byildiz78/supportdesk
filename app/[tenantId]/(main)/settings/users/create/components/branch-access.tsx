'use client';

import { Store, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Efr_Users } from "@/pages/api/settings/users/types";
import { useState } from "react";

interface BranchAccessProps {
  formData: Efr_Users;
  setFormData: (data: Efr_Users) => void;
  selectedFilter: {
    selectedBranches: Branch[];
    branches: Branch[];
  };
}

interface Branch {
  BranchID: string | number;
  ExternalCode: string;
  BranchName: string;
  Region: string;
}

export function BranchAccess({ formData, setFormData, selectedFilter }: BranchAccessProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    formData.UserBranchs ? formData.UserBranchs.split(",") : []
  );

  const branches = selectedFilter.selectedBranches.length <= 0
    ? selectedFilter.branches
    : selectedFilter.selectedBranches;

  const filteredBranches = branches.filter(
    (branch) =>
      branch.BranchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.ExternalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.Region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBranch = (branchId: string | number) => {
    const branchIdString = branchId.toString();
    const newSelectedBranches = selectedBranches.includes(branchIdString)
      ? selectedBranches.filter((id) => id !== branchIdString)
      : [...selectedBranches, branchIdString];

    setSelectedBranches(newSelectedBranches);
    setFormData({
      ...formData,
      UserBranchs: newSelectedBranches.join(","),
    });
  };

  const selectAllBranches = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const allBranchIds = branches.map((branch) => branch.BranchID.toString());
    setSelectedBranches(allBranchIds);
    setFormData({
      ...formData,
      UserBranchs: allBranchIds.join(","),
    });
  };

  const clearAllBranches = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBranches([]);
    setFormData({
      ...formData,
      UserBranchs: "",
    });
  };

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Şube Erişimi</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Kullanıcının erişebileceği şubeleri seçin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllBranches}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Tümünü Seç
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={clearAllBranches}
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Şube ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all duration-200"
            />
          </div>

          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Kod</TableHead>
                  <TableHead>Şube Adı</TableHead>
                  <TableHead>Bölge</TableHead>
                  <TableHead className="w-[100px] text-right">Seçili</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map((branch) => (
                  <TableRow
                    key={branch.BranchID}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleBranch(branch.BranchID)}
                  >
                    <TableCell className="font-medium">{branch.ExternalCode}</TableCell>
                    <TableCell>{branch.BranchName}</TableCell>
                    <TableCell>{branch.Region}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            selectedBranches.includes(branch.BranchID.toString())
                              ? "bg-primary text-primary-foreground"
                              : "border border-border"
                          }`}
                        >
                          {selectedBranches.includes(branch.BranchID.toString()) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
