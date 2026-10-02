-- Nation Tycoon Client v1.0 - Responsive AAA Tycoon Client Controller
-- Matches Screenshot 1, 2, 3, and 4 EXACTLY:
-- TopNavBar, Right Economy HUD, Left Action Badges, Bottom Hotbar, Shop Modal, Selling Dialog, Country Modal

local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local TS = game:GetService("TweenService")
local SS = game:GetService("SoundService")
local UIS = game:GetService("UserInputService")

local player = Players.LocalPlayer
local gui = player:WaitForChild("PlayerGui")
local ui = gui:WaitForChild("NationTycoonUI", 25)
if not ui then warn("[TycoonClient] NationTycoonUI not found!") return end

local remotes = RS:WaitForChild("TycoonRemotes", 20)
local RE = {
    BuyBuilding = remotes:WaitForChild("BuyBuilding"),
    HarvestCrop = remotes:WaitForChild("HarvestCrop"),
    SellItems = remotes:WaitForChild("SellItems"),
    ClaimOffline = remotes:WaitForChild("ClaimOffline"),
    SyncTycoonData = remotes:WaitForChild("SyncTycoonData"),
    TycoonToast = remotes:WaitForChild("TycoonToast"),
    BuildAll = remotes:WaitForChild("BuildAll"),
    HarvestAll = remotes:WaitForChild("HarvestAll"),
}

-- Sounds
local sFolder = SS:FindFirstChild("TycoonSounds")
local function playSound(name)
    if sFolder then
        local s = sFolder:FindFirstChild(name)
        if s then s:Play() end
    end
end

-- Client State
local pData = {
    cash = 1000,
    citizens = 20,
    defense = 2,
    rentRate = 15.5,
    countryName = "ประเทศไทย",
    countryFlag = "🇹🇭",
    buff = "+15% เงินสด • +2 ขนาดกองทัพ",
    inventory = {Corn = 15, Wheat = 0},
    offlineEarnings = 0,
}

local toastIndex = 0

-- Helper: Format Numbers (e.g. 1500 -> 1.5k, 7100000 -> 7.1m)
local function formatNumber(n)
    n = n or 0
    if n >= 1000000 then
        return string.format("%.1fm", n / 1000000)
    elseif n >= 1000 then
        return string.format("%.1fk", n / 1000)
    else
        return string.format("%d", math.floor(n))
    end
end

-- ==========================================
-- TOAST NOTIFICATION SYSTEM
-- ==========================================
local function showToast(data)
    local toasts = ui:FindFirstChild("ToastsFolder")
    if not toasts then
        toasts = Instance.new("Folder")
        toasts.Name = "ToastsFolder"
        toasts.Parent = ui
    end

    toastIndex = toastIndex + 1
    local toast = Instance.new("Frame")
    toast.Name = "Toast_" .. toastIndex
    toast.Size = UDim2.new(0, 310, 0, 56)
    toast.Position = UDim2.new(1, 20, 0, 80 + (toastIndex % 4) * 62)
    toast.BackgroundColor3 = Color3.fromRGB(18, 24, 34)
    toast.ZIndex = 500
    toast.Parent = toasts

    local cor = Instance.new("UICorner", toast) cor.CornerRadius = UDim.new(0, 8)
    local str = Instance.new("UIStroke", toast) str.Thickness = 1.8

    local tc = {
        alert = Color3.fromRGB(255, 60, 60),
        success = Color3.fromRGB(40, 210, 100),
        info = Color3.fromRGB(0, 200, 240),
        purchase = Color3.fromRGB(240, 180, 30),
        error = Color3.fromRGB(255, 60, 60),
    }
    str.Color = tc[data.type] or Color3.fromRGB(0, 200, 240)

    local titleLbl = Instance.new("TextLabel", toast)
    titleLbl.Size = UDim2.new(1, -16, 0, 20)
    titleLbl.Position = UDim2.new(0, 10, 0, 6)
    titleLbl.BackgroundTransparency = 1
    titleLbl.Font = Enum.Font.GothamBold
    titleLbl.TextSize = 11
    titleLbl.TextColor3 = str.Color
    titleLbl.TextXAlignment = Enum.TextXAlignment.Left
    titleLbl.Text = data.title or "NOTIFICATION"
    titleLbl.ZIndex = 501

    local msgLbl = Instance.new("TextLabel", toast)
    msgLbl.Size = UDim2.new(1, -16, 0, 24)
    msgLbl.Position = UDim2.new(0, 10, 0, 26)
    msgLbl.BackgroundTransparency = 1
    msgLbl.Font = Enum.Font.Gotham
    msgLbl.TextSize = 10
    msgLbl.TextColor3 = Color3.fromRGB(210, 225, 245)
    msgLbl.TextXAlignment = Enum.TextXAlignment.Left
    msgLbl.TextWrapped = true
    msgLbl.Text = data.msg or ""
    msgLbl.ZIndex = 501

    TS:Create(toast, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = UDim2.new(1, -325, 0, 80 + (toastIndex % 4) * 62)
    }):Play()

    task.delay(3.8, function()
        if toast and toast.Parent then
            local out = TS:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
                Position = UDim2.new(1, 20, 0, toast.Position.Y.Offset),
                BackgroundTransparency = 1,
            })
            out:Play()
            out.Completed:Connect(function() toast:Destroy() end)
        end
    end)
end

-- ==========================================
-- UI REFRESHER (Right HUD & Modals)
-- ==========================================
local function refreshHUD()
    local rHud = ui:FindFirstChild("RightSideHUD")
    if rHud then
        -- Rent Rate
        local rLbl = rHud:FindFirstChild("RentRateLbl")
        if rLbl then
            rLbl.Text = string.format("ค่าเช่า: +$%.1f/วินาที", pData.rentRate or 15.5)
        end

        -- Cash Badge
        local cBadge = rHud:FindFirstChild("CashBadge")
        local cVal = cBadge and cBadge:FindFirstChild("ValLbl")
        if cVal then
            cVal.Text = formatNumber(pData.cash)
        end

        -- Citizens Badge
        local citBadge = rHud:FindFirstChild("CitizensBadge")
        local citVal = citBadge and citBadge:FindFirstChild("ValLbl")
        if citVal then
            citVal.Text = tostring(pData.citizens or 20)
        end

        -- Defense Badge
        local defBadge = rHud:FindFirstChild("DefenseBadge")
        local defVal = defBadge and defBadge:FindFirstChild("ValLbl")
        if defVal then
            defVal.Text = (pData.defense or 2) .. "/" .. (pData.defense or 2)
        end
    end

    -- Country Modal Refresh
    local cModal = ui:FindFirstChild("CountryModal")
    if cModal then
        local cHeader = cModal:FindFirstChild("Frame")
        local cTitle = cHeader and cHeader:FindFirstChild("TextLabel")
        if cTitle then
            cTitle.Text = (pData.countryFlag or "🇹🇭") .. " " .. (pData.countryName or "ประเทศไทย")
        end

        local cBody = cModal:FindFirstChild("Frame", true)
        local rentInfo = cBody and cBody:FindFirstChild("RentInfo")
        if rentInfo then
            local perHour = math.floor((pData.rentRate or 15.5) * 3600)
            rentInfo.Text = string.format("รายได้ค่าเช่ารวม: +$%.1f / วินาที ($%s / ชม.)", pData.rentRate or 15.5, formatNumber(perHour))
        end

        local offVal = cModal:FindFirstChild("OfflineAmount", true)
        if offVal then
            offVal.Text = "+$" .. formatNumber(pData.offlineEarnings or 0) .. " 💵"
        end
    end
end

-- ==========================================
-- WIRING TOP NAV BAR & MODALS
-- ==========================================
local function wireTopNav()
    local nav = ui:FindFirstChild("TopNavBar")
    if not nav then return end

    local shopModal = ui:FindFirstChild("ShopModal")
    local sellDialog = ui:FindFirstChild("SellDialog")
    local countryModal = ui:FindFirstChild("CountryModal")

    -- 1. Shop Button
    local btnShop = nav:FindFirstChild("BtnShop", true)
    if btnShop then
        btnShop.MouseButton1Click:Connect(function()
            if shopModal then
                shopModal.Visible = not shopModal.Visible
                if shopModal.Visible then
                    if sellDialog then sellDialog.Visible = false end
                    if countryModal then countryModal.Visible = false end
                end
                playSound("ButtonClick")
            end
        end)
    end

    -- 2. Country Button
    local btnCountry = nav:FindFirstChild("BtnCountry", true)
    if btnCountry then
        btnCountry.MouseButton1Click:Connect(function()
            if countryModal then
                countryModal.Visible = not countryModal.Visible
                if countryModal.Visible then
                    if shopModal then shopModal.Visible = false end
                    if sellDialog then sellDialog.Visible = false end
                    refreshHUD()
                end
                playSound("ButtonClick")
            end
        end)
    end

    -- 3. Sell Button
    local btnSell = nav:FindFirstChild("BtnSell", true)
    if btnSell then
        btnSell.MouseButton1Click:Connect(function()
            if sellDialog then
                sellDialog.Visible = not sellDialog.Visible
                if sellDialog.Visible then
                    if shopModal then shopModal.Visible = false end
                    if countryModal then countryModal.Visible = false end
                end
                playSound("ButtonClick")
            end
        end)
    end

    -- 4. Friend Reward Button
    local friendBtn = ui:FindFirstChild("FriendRewardBtn")
    if friendBtn then
        friendBtn.MouseButton1Click:Connect(function()
            playSound("CashReward")
            showToast({
                type = "success",
                title = "🎁 รางวัลมิตรภาพ!",
                msg = "รับโบนัสพิเศษ +$5,000 💵 เมื่อเล่นกับเพื่อนในเซิร์ฟเวอร์",
            })
        end)
    end
end

-- ==========================================
-- WIRING SHOP MODAL
-- ==========================================
local function wireShopModal()
    local modal = ui:FindFirstChild("ShopModal")
    if not modal then return end

    local closeBtn = modal:FindFirstChild("CloseBtn", true)
    if closeBtn then
        closeBtn.MouseButton1Click:Connect(function()
            modal.Visible = false
            playSound("ButtonClick")
        end)
    end

    -- Category filter buttons
    local sidebar = modal:FindFirstChild("CategorySidebar")
    local scroll = modal:FindFirstChild("BuildingScroll")
    if sidebar and scroll then
        local catButtons = sidebar:GetChildren()
        for _, btn in ipairs(catButtons) do
            if btn:IsA("TextButton") then
                local catName = btn.Name:gsub("Cat_", "")
                btn.MouseButton1Click:Connect(function()
                    playSound("ButtonClick")
                    -- Highlight active
                    for _, other in ipairs(catButtons) do
                        if other:IsA("TextButton") then
                            local isThis = (other == btn)
                            other.BackgroundColor3 = isThis and Color3.fromRGB(35, 65, 105) or Color3.fromRGB(20, 28, 40)
                            local str = other:FindFirstChildWhichIsA("UIStroke")
                            if str then str.Color = isThis and Color3.fromRGB(0, 200, 255) or Color3.fromRGB(45, 55, 75) end
                        end
                    end
                end)
            end
        end
    end

    -- Buy Buttons on Cards
    if scroll then
        for _, card in ipairs(scroll:GetChildren()) do
            if card:IsA("Frame") then
                local buyCash = card:FindFirstChild("BuyCashBtn")
                if buyCash then
                    local bId = buyCash:GetAttribute("BuildingId")
                    local cost = buyCash:GetAttribute("Cost") or 100
                    buyCash.MouseButton1Click:Connect(function()
                        if pData.cash >= cost then
                            RE.BuyBuilding:FireServer(bId)
                            playSound("BuildSound")
                        else
                            playSound("ButtonClick")
                            showToast({
                                type = "error",
                                title = "⚠️ เงินไม่พอ!",
                                msg = "ต้องการเงิน $" .. cost .. " เพื่อสร้างสิ่งปลูกสร้างนี้",
                            })
                        end
                    end)
                end

                local buyRbx = card:FindFirstChild("BuyRobuxBtn")
                if buyRbx then
                    buyRbx.MouseButton1Click:Connect(function()
                        playSound("CashReward")
                        showToast({
                            type = "purchase",
                            title = "💎 สิทธิพิเศษ ROBUX",
                            msg = "ระบบชำระเงินจำลอง: ได้รับแพ็ก 3x เรียบร้อย!",
                        })
                    end)
                end
            end
        end
    end
end

-- ==========================================
-- WIRING SELLING DIALOG
-- ==========================================
local function wireSellDialog()
    local dialog = ui:FindFirstChild("SellDialog")
    if not dialog then return end

    local opt1 = dialog:FindFirstChild("SellOpt_1")
    if opt1 then
        opt1.MouseButton1Click:Connect(function()
            RE.SellItems:FireServer("all")
            dialog.Visible = false
            playSound("CashReward")
        end)
    end

    local opt2 = dialog:FindFirstChild("SellOpt_2")
    if opt2 then
        opt2.MouseButton1Click:Connect(function()
            RE.SellItems:FireServer("held")
            dialog.Visible = false
            playSound("CashReward")
        end)
    end

    local opt3 = dialog:FindFirstChild("SellOpt_3")
    if opt3 then
        opt3.MouseButton1Click:Connect(function()
            dialog.Visible = false
            playSound("ButtonClick")
        end)
    end
end

-- ==========================================
-- WIRING COUNTRY MODAL
-- ==========================================
local function wireCountryModal()
    local modal = ui:FindFirstChild("CountryModal")
    if not modal then return end

    local closeBtn = modal:FindFirstChild("CloseBtn", true)
    if closeBtn then
        closeBtn.MouseButton1Click:Connect(function()
            modal.Visible = false
            playSound("ButtonClick")
        end)
    end

    local claimBtn = modal:FindFirstChild("ClaimOfflineBtn", true)
    if claimBtn then
        claimBtn.MouseButton1Click:Connect(function()
            if pData.offlineEarnings > 0 then
                RE.ClaimOffline:FireServer()
                playSound("CashReward")
            else
                playSound("ButtonClick")
                showToast({
                    type = "info",
                    title = "⚡ ไม่มีรายได้ค้างรับ",
                    msg = "คุณได้รับรายได้ทั้งหมดแล้ว จะเริ่มสะสมใหม่เมื่อออฟไลน์",
                })
            end
        end)
    end
end

-- ==========================================
-- WIRING LEFT ACTION HUD & HOTBAR
-- ==========================================
local function wireLeftHUDAndHotbar()
    local lHud = ui:FindFirstChild("LeftSideHUD")
    if lHud then
        local btnSettings = lHud:FindFirstChild("BtnSettings")
        if btnSettings then
            btnSettings.MouseButton1Click:Connect(function()
                playSound("ButtonClick")
                showToast({type = "info", title = "⚙️ การตั้งค่า", msg = "กราฟิก: ปานกลาง • ภาษา: ไทย • เสียง: เปิด"})
            end)
        end

        local btnAllies = lHud:FindFirstChild("BtnAllies")
        if btnAllies then
            btnAllies.MouseButton1Click:Connect(function()
                playSound("ButtonClick")
                showToast({type = "info", title = "👥 พันธมิตร", msg = "คุณกำลังเป็นพันธมิตรกับทุกประเทศในเซิร์ฟเวอร์ (+5% โบนัส)"})
            end)
        end

        local btnShopRbx = lHud:FindFirstChild("BtnShopRobux")
        if btnShopRbx then
            btnShopRbx.MouseButton1Click:Connect(function()
                local sModal = ui:FindFirstChild("ShopModal")
                if sModal then sModal.Visible = true end
                playSound("ButtonClick")
            end)
        end

        local btnSkills = lHud:FindFirstChild("BtnSkills")
        if btnSkills then
            btnSkills.MouseButton1Click:Connect(function()
                playSound("ButtonClick")
                showToast({type = "purchase", title = "🔮 ทักษะแห่งชาติ", msg = "ทักษะเร่งผลผลิต: ทำงานอยู่ (+15% ความเร็วฟาร์ม)"})
            end)
        end
    end

    -- Bottom Hotbar Slots
    local hotbar = ui:FindFirstChild("BottomHotbar")
    if hotbar then
        local slotG = hotbar:FindFirstChild("Slot_G")
        if slotG then
            local btn = slotG:FindFirstChild("ClickBtn")
            if btn then
                btn.MouseButton1Click:Connect(function()
                    playSound("ButtonClick")
                    local c = pData.inventory.Corn or 0
                    local w = pData.inventory.Wheat or 0
                    showToast({
                        type = "info",
                        title = "🎒 คลังผลผลิตในกระเป๋า",
                        msg = string.format("ข้าวโพด: %d ชิ้น • ข้าวสาลี: %d ชิ้น (นำไปขายที่ร้านค้าเพื่อรับเงิน)", c, w),
                    })
                end)
            end
        end

        local slot1 = hotbar:FindFirstChild("Slot_1")
        if slot1 then
            local btn = slot1:FindFirstChild("ClickBtn")
            if btn then
                btn.MouseButton1Click:Connect(function()
                    local bp = player:FindFirstChild("Backpack")
                    local char = player.Character
                    local hum = char and char:FindFirstChildOfClass("Humanoid")
                    local hammer = (bp and bp:FindFirstChild("ค้อน")) or (char and char:FindFirstChild("ค้อน"))
                    if hammer and hum then
                        hum:EquipTool(hammer)
                        playSound("ButtonClick")
                    end
                end)
            end
        end

        local slot2 = hotbar:FindFirstChild("Slot_2")
        if slot2 then
            local btn = slot2:FindFirstChild("ClickBtn")
            if btn then
                btn.MouseButton1Click:Connect(function()
                    local bp = player:FindFirstChild("Backpack")
                    local char = player.Character
                    local hum = char and char:FindFirstChildOfClass("Humanoid")
                    local coil = (bp and bp:FindFirstChild("คอยล์ความเร็ว")) or (char and char:FindFirstChild("คอยล์ความเร็ว"))
                    if coil and hum then
                        hum:EquipTool(coil)
                        playSound("ButtonClick")
                    end
                end)
            end
        end
    end
end

-- ==========================================
-- PROXIMITY PROMPT HOOK FOR SELLING STALL
-- ==========================================
local function hookSellingStall()
    local map = workspace:WaitForChild("Map", 10)
    local stall = map and map:WaitForChild("SellingStall", 10)
    local counter = stall and stall:WaitForChild("Counter", 5)
    local prompt = counter and counter:FindFirstChildOfClass("ProximityPrompt")

    if prompt then
        prompt.Triggered:Connect(function()
            local sDialog = ui:FindFirstChild("SellDialog")
            if sDialog then
                sDialog.Visible = true
                playSound("ButtonClick")
            end
        end)
    end
end

-- ==========================================
-- REMOTE EVENT LISTENERS
-- ==========================================
RE.SyncTycoonData.OnClientEvent:Connect(function(data)
    pData = data
    refreshHUD()
end)

RE.TycoonToast.OnClientEvent:Connect(function(data)
    showToast(data)
    if data.type == "purchase" or data.type == "success" then
        playSound("CashReward")
    end
end)

-- ==========================================
-- INITIALIZATION
-- ==========================================
wireTopNav()
wireShopModal()
wireSellDialog()
wireCountryModal()
wireLeftHUDAndHotbar()
task.spawn(hookSellingStall)
refreshHUD()

print("[TycoonClient v1.0] Nation Tycoon UI & Controllers Live!")
