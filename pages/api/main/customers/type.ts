export type Customer = {
    AutoID?: number;
    CustomerID?: number;
    CustomerKey?: string; // uniqueidentifier in SQL becomes string in TS
    CustomerGlobalKey?: string;
    CustomerIsActive?: boolean; // bit in SQL becomes boolean in TS
    CustomerName?: string; // nvarchar becomes string
    CustomerFullName?: string;
    CardNumber?: string;
    PhoneNumber?: string;
    CustomerNotes?: string;
    OrderCount?: number;
    LastCallDate?: Date; // datetime becomes Date
    CallingCount?: number;
    AllowHouseAccount?: boolean;
    IsFrequentDiner?: boolean;
    CreditLimit?: number; // float becomes number
    CreditSatusID?: number;
    DiscountPercent?: number;
    SpecialBonusPercent?: number;
    TotalDebt?: number;
    TotalPayment?: number;
    TotalRemainig?: number; // note: typo from original (should be "Remaining")
    BonusStartupValue?: number;
    TotalBonusUsed?: number;
    TotalBonusEarned?: number;
    TotalBonusRemaing?: number; // note: typo from original
    CityName?: string;
    District?: string;
    Neighborhood?: string;
    Avenue?: string;
    Street?: string;
    Buildings?: string;
    Block?: string;
    Apartment?: string;
    ApartmentNo?: string;
    FlatNo?: string;
    IsDefault?: boolean;
    TaxOfficeName?: string;
    TaxNumber?: string;
    ZipCode?: string;
    AddressNotes?: string;
    AreaCode?: string;
    CustomerSpecialNotes?: string;
    BirthDay?: Date;
    MaritialStatus?: number; // note: typo from original (should be "Marital")
    Age?: number;
    EmailAddress?: string;
    Sexuality?: number;
    FacebookAccount?: string;
    TwitterAccount?: string;
    WebSite?: string;
    PhotoPath?: string;
    ProximityCardID?: string;
    EditKey?: string;
    SyncKey?: string;
    BranchID?: number;
    LockData?: boolean;
    LockStationID?: number;
    AddUserID?: number;
    AddDateTime?: Date;
    EditUserID?: number;
    EditDateTime?: Date;
    WebUserName?: string;
    WebPassword?: string;
    OpenValue?: number;
    CardType?: string;
    LastTransactionTime?: Date;
};

// Category için enum tanımı (opsiyonel kullanım için)
export enum UserCategory {
    Standart = 1,
    CokluSube = 2,
    BolgeSorumlusu = 3,
    Yonetici = 4,
    SuperAdmin = 5,
    OpSorumlusu = 6,
    MusteriHizmetleri = 7,
    InsanKaynaklari = 8,
    IsGelistirme = 9,
    IT = 10,
    Pazarlama = 11,
    Sube = 12
}